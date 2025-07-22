import "express"
import "reflect-metadata"
import express from 'express'
import admin from 'firebase-admin'
import WebSocket, { WebSocketServer } from 'ws'
import { createRequire } from 'module'
import { LRUCache } from 'lru-cache'
import { createMainRouter } from './routes/route.js'
import { SERVER_PORT, WEBSOCKET_PORT, APP_NAME } from './constants.js'
import { AppDataSource } from "./data-source.js"
import { UserService } from "./services/UserService.js"
import { User } from "./entity/User.js"
import { Session } from "./entity/Session.js"
import { Message } from "./entity/Message.js"
import { SessionService } from "./services/SessionService.js"
import { MessageService } from "./services/MessageService.js"
import { UserController } from "./controllers/UserController.js"
import { MessageController } from "./controllers/MessageController.js"
import { SessionController } from "./controllers/SessionController.js"
import { Authenticate } from "./middlewares/Authentificate.js"
import { MyWebSocket } from "./interfaces/MyWebSocket.js"

const requireJSON = createRequire(import.meta.url)
const serviceAccount = requireJSON('./config/serviceAccountKey.json')

const usernameCache = new LRUCache({
    max: 100_000,
    ttl: 1000 * 60 * 60 * 24
})

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

const app = express()
app.use(express.json())

const userRepository = AppDataSource.getRepository(User)
const sessionRepository = AppDataSource.getRepository(Session)
const messageRepository = AppDataSource.getRepository(Message)

const userService = new UserService(userRepository, messageRepository)
const sessionService = new SessionService(sessionRepository)
const messageService = new MessageService(messageRepository)

const userController = new UserController(userService, sessionService)
const sessionController = new SessionController(sessionService)
const messageController = new MessageController(messageService)

AppDataSource.initialize().then(async () => {
    console.log("Data Source has been initialized!")

    const mainRouter = createMainRouter(userController, messageController, sessionController)
    app.use('/', mainRouter)

    app.listen(SERVER_PORT, () => {
        console.log(`Сервер запущен на http://localhost:${SERVER_PORT}`)
    })
})

const userConnections = new Map()

const webSocketServer = new WebSocketServer({ port: WEBSOCKET_PORT })

webSocketServer.on('connection', async (webSocket, request) => {
    const ws = webSocket as MyWebSocket

    const requestUrl = request.url || ""
    const url = new URL(requestUrl, `http://${request.headers.host}`)
    const token = url.searchParams.get('token')

    if (!token) {
        ws.close(1008, 'Нет токена')
        return
    }

    try {
        const authenticate = new Authenticate(sessionService)
        const isVerify = await authenticate.verify(token)

        if (!isVerify.isVerify) {
            ws.close(1008, 'Недопустимый токен')
            return
        }

        ws.userId = isVerify.userId
        ws.token = token

        if (!userConnections.has(ws.userId)) {
            userConnections.set(ws.userId, new Map())
        }
        userConnections.get(ws.userId).set(ws.token, ws)

        console.log(`Пользователь ${isVerify.userId} подключился через WebSocket`)
    } catch (err) {
        ws.close(1008, 'Ошибка проверки токена')
    }

    ws.on('message', (data) => handleMessage(ws, data))

    ws.on('close', () => handleConnectionClose(ws))
})

async function handleMessage(ws: MyWebSocket, data: WebSocket.RawData) {
    try {
        const message = JSON.parse(data.toString())

        if (message.action == "DISMISS_SESSION") {
            const sessionId = message.data.sessionId
            const session = await sessionService.getSession(sessionId, ws.userId)

            const token = session?.token

            if (!token) {
                ws.close(1008, 'Сессия не найдена')
                return
            }

            disconnectUserByIdAndToken(ws.userId, token)

            return
        }

        const targetId = message.receiverId

        const currentUserSessions = userConnections.get(ws.userId)

        const MAX_MESSAGE_LENGTH = 4096

        const parts = []
        const text = message.text

        for (let i = 0; i < text.length; i += MAX_MESSAGE_LENGTH) {
            const messagePart = text.slice(i, i + MAX_MESSAGE_LENGTH)
            parts.push(messagePart)
        }

        for (let i = 0; i < parts.length; i++) {
            const partText = parts[i]

            await messageService.addMessage(message.senderId, message.receiverId, partText)

            if (message.receiverId != message.senderId) {
                const senderName = await getUsername(message.senderId)
                await sendPushToUser(message.receiverId, partText, senderName, message.senderId)
            }
        }

        if (currentUserSessions) {
            for (const client of currentUserSessions) {
                if (client[1].readyState === WebSocket.OPEN && client[1].token != ws.token) {
                    parts.forEach(part => {
                        let g = message
                        g.text = part
                        client[1].send(JSON.stringify(g))
                    })
                }
            }
        }

        if (targetId != ws.userId) {
            const connections = userConnections.get(targetId)

            if (connections) {
                for (const client of connections) {
                    if (client[1].readyState === WebSocket.OPEN && client[1].token != ws.token) {
                        parts.forEach(part => {
                            let g = message
                            g.text = part
                            client[1].send(JSON.stringify(g))
                        })
                    }
                }
            }
        }

        console.log(message)
    }
    catch (e) {
        console.log('handleMessage error', e)
    }
}

function handleConnectionClose(ws: MyWebSocket) {
    const userId = ws.userId
    console.log(`User ${userId} disconnected`)

    if (ws.userId && ws.token && userConnections.has(ws.userId)) {
        const tokenMap = userConnections.get(ws.userId)

        tokenMap.delete(ws.token)

        if (tokenMap.size === 0) {
            userConnections.delete(ws.userId)
        }
    }
}

async function getUsername(userId: number) {
    const name = usernameCache.get(userId)

    if (name) {
        return name
    }

    const user = await userService.getUserById(userId)

    if (user) {
        const name = `${user.firstName} ${user.lastName}`
        usernameCache.set(userId, name)

        return name
    }

    return APP_NAME
}

async function sendPushToUser(userId: number, messageText: string, senderName: string, chatId: number) {
    try {
        const sessions = await sessionService.getUserSessions(userId)
        const tokens = sessions.map(session => session.fcmToken).filter(token => token !== undefined)

        if (tokens.length === 0) {
            console.log('Нет токенов для отправки.')
            return
        }

        const message = {
            tokens: tokens,
            data: {
                title: senderName,
                body: messageText,
                chatId: String(chatId),
            }
        }

        const response = await admin.messaging().sendEachForMulticast(message)

        console.log(`Push-уведомления отправлены:`, response)
    } catch (error) {
        console.error('Ошибка отправки уведомлений:', error)
    }
}

async function disconnectUserByIdAndToken(userId: number, token: string) {
    const tokenMap = userConnections.get(userId)

    if (tokenMap) {
        const ws = tokenMap.get(token)

        if (ws) {
            ws.close(1008, 'Сессия отключена сервером')
            tokenMap.delete(token)
        }

        if (tokenMap.size === 0) {
            userConnections.delete(userId)
        }
    }

    await sessionService.deleteSession(userId, token)
}

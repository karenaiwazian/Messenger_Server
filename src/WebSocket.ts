import admin from 'firebase-admin'
import { LRUCache } from "lru-cache"
import { createRequire } from "module"
import { IncomingMessage } from "http"
import { RawData, WebSocket, WebSocketServer } from "ws"
import { WEBSOCKET_PORT, APP_NAME } from "./constants.js"
import { MyWebSocket } from "./interfaces/MyWebSocket.js"
import { Authenticate } from "./middlewares/Authentificate.js"
import { UserService } from "./services/UserService.js"
import { MessageService } from "./services/MessageService.js"
import { SessionService } from "./services/SessionService.js"

export class WebSocketController {

    private userService = new UserService()
    private sessionService = new SessionService()
    private messageService = new MessageService()

    private userConnections = new Map()

    private usernameCache = new LRUCache({
        max: 100_000,
        ttl: 1000 * 60 * 60 * 24
    })

    private webSocketServer = new WebSocketServer({ port: WEBSOCKET_PORT })

    constructor() {
        const requireJSON = createRequire(import.meta.url)
        const serviceAccount = requireJSON('./config/serviceAccountKey.json')

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        })


        this.webSocketServer.on('connection', this.handleConnection)
    }

    handleConnection = async (webSocket: WebSocket, request: IncomingMessage) => {
        const ws = webSocket as MyWebSocket

        const requestUrl = request.url || ""
        const url = new URL(requestUrl, `http://${request.headers.host}`)
        const token = url.searchParams.get('token')

        if (!token) {
            ws.close(1008, 'Нет токена')
            return
        }

        try {
            const authenticate = new Authenticate()
            const isVerify = await authenticate.verify(token)

            if (!isVerify.isVerify) {
                ws.close(1008, 'Недопустимый токен')
                return
            }

            ws.userId = isVerify.userId
            ws.token = token

            if (!this.userConnections.has(ws.userId)) {
                this.userConnections.set(ws.userId, new Map())
            }
            this.userConnections.get(ws.userId).set(ws.token, ws)

            console.log(`Пользователь ${isVerify.userId} подключился через WebSocket`)
        } catch (err) {
            ws.close(1008, 'Ошибка проверки токена')
        }

        ws.on('message', (data) => this.handleMessage(ws, data))

        ws.on('close', () => this.handleConnectionClose(ws))
    }

    handleMessage = async (ws: MyWebSocket, data: RawData) => {
        try {
            const message = JSON.parse(data.toString())

            if (message.action == "DISMISS_SESSION") {
                const sessionId = message.data.sessionId
                const session = await this.sessionService.getSession(sessionId, ws.userId)

                const token = session?.token

                if (!token) {
                    ws.close(1008, 'Сессия не найдена')
                    return
                }

                this.disconnectUserByIdAndToken(ws.userId, token)

                return
            }

            const targetId = message.receiverId

            const currentUserSessions = this.userConnections.get(ws.userId)

            const MAX_MESSAGE_LENGTH = 4096

            const parts = []
            const text = message.text

            for (let i = 0; i < text.length; i += MAX_MESSAGE_LENGTH) {
                const messagePart = text.slice(i, i + MAX_MESSAGE_LENGTH)
                parts.push(messagePart)
            }

            for (let i = 0; i < parts.length; i++) {
                const partText = parts[i]

                await this.messageService.addMessage(parseInt(message.senderId), parseInt(message.receiverId), partText)

                if (message.receiverId != message.senderId) {
                    const senderName = await this.getUsername(message.senderId)
                    await this.sendPushToUser(message.receiverId, partText, senderName, message.senderId)
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
                const connections = this.userConnections.get(targetId)

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

    handleConnectionClose = (ws: MyWebSocket) => {
        const userId = ws.userId
        console.log(`User ${userId} disconnected`)

        if (ws.userId && ws.token && this.userConnections.has(ws.userId)) {
            const tokenMap = this.userConnections.get(ws.userId)

            tokenMap.delete(ws.token)

            if (tokenMap.size === 0) {
                this.userConnections.delete(ws.userId)
            }
        }
    }

    getUsername = async (userId: number) => {
        const name = this.usernameCache.get(userId)

        if (name) {
            return name
        }

        const user = await this.userService.getUserById(userId)

        if (user) {
            const name = `${user.firstName} ${user.lastName}`
            this.usernameCache.set(userId, name)

            return name
        }

        return APP_NAME
    }

    sendPushToUser = async (userId: number, messageText: string, senderName: string, chatId: number) => {
        try {
            const sessions = await this.sessionService.getUserSessions(userId)
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

    disconnectUserByIdAndToken = async (userId: number, token: string) => {
        const tokenMap = this.userConnections.get(userId)

        if (tokenMap) {
            const ws = tokenMap.get(token)

            if (ws) {
                ws.close(1008, 'Сессия отключена сервером')
                tokenMap.delete(token)
            }

            if (tokenMap.size === 0) {
                this.userConnections.delete(userId)
            }
        }

        await this.sessionService.deleteSession(userId, token)
    }
}

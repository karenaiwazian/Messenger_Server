import admin from 'firebase-admin'
import { LRUCache } from "lru-cache"
import { createRequire } from "module"
import { IncomingMessage } from "http"
import { RawData, WebSocket, WebSocketServer } from "ws"
import { WEBSOCKET_PORT, APP_NAME } from "./constants.js"
import { MyWebSocket } from "./interfaces/MyWebSocket.js"
import { Authenticate } from "./middlewares/Authentificate.js"
import { SessionService } from "./services/SessionService.js"
import { Message } from './interfaces/Message.js'

export class WebSocketController {

    private sessionService = new SessionService()
    private authenticate = new Authenticate()

    private static userConnections = new Map<number, Map<string, MyWebSocket>>()

    private usernameCache = new LRUCache<number, string>({
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

    private handleConnection = async (webSocket: WebSocket, request: IncomingMessage) => {
        const ws = webSocket as MyWebSocket

        const requestUrl = request.url || ""
        const url = new URL(requestUrl, `http://${request.headers.host}`)
        const token = url.searchParams.get('token')

        if (!token) {
            ws.close(1008, 'Нет токена')
            return
        }

        try {
            const isVerify = await this.authenticate.verify(token)

            if (!isVerify.isVerify) {
                ws.close(1008, 'Недопустимый токен')
                return
            }

            ws.userId = isVerify.userId
            ws.token = token

            if (!WebSocketController.userConnections.has(ws.userId)) {
                WebSocketController.userConnections.set(ws.userId, new Map())
            }

            WebSocketController.userConnections.get(ws.userId)!.set(ws.token, ws)

            console.log(`Пользователь ${isVerify.userId} подключился через WebSocket`)
        } catch (err) {
            ws.close(1008, 'Ошибка проверки токена')
            return
        }

        ws.on('message', (data) => this.handleMessage(ws, data))

        ws.on('close', () => this.handleConnectionClose(ws))
    }

    private handleMessage = async (ws: MyWebSocket, data: RawData) => {
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

            console.log(message)
        }
        catch (e) {
            console.log('handleMessage error', e)
        }
    }

    public static sendMessageToChat = (message: Message) => {
        const senderId = message.senderId
        const chatId = message.chatId

        // const ds: any = message
        // ds.sendTime = message.sendTime

        const messageToSend = {
            action: 'NEW_MESSAGE',
            data: {
                message: message
            }
        }

        const jsonMessage = JSON.stringify(messageToSend)

        const senderSessions = this.userConnections.get(senderId)

        if (senderSessions) {
            for (const [token, clientWs] of senderSessions) {
                if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(jsonMessage)
                }
            }
        }

        if (chatId !== senderId) {
            const receiverSessions = this.userConnections.get(chatId)
            if (receiverSessions) {
                for (const [token, clientWs] of receiverSessions) {
                    if (clientWs.readyState === WebSocket.OPEN) {
                        clientWs.send(jsonMessage)
                    }
                }
            }
        }
    }

    private handleConnectionClose = (ws: MyWebSocket) => {
        const userId = ws.userId
        console.log(`User ${userId} disconnected`)

        if (ws.userId && ws.token && WebSocketController.userConnections.has(ws.userId)) {
            const tokenMap = WebSocketController.userConnections.get(ws.userId)

            tokenMap?.delete(ws.token)

            if (tokenMap?.size === 0) {
                WebSocketController.userConnections.delete(ws.userId)
            }
        }
    }

    private disconnectUserByIdAndToken = async (userId: number, token: string) => {
        const tokenMap = WebSocketController.userConnections.get(userId)

        if (!tokenMap) {
            await this.sessionService.terminateSessionByToken(token)
            return
        }

        const ws = tokenMap.get(token)

        if (ws) {
            ws.close(1008, 'Сессия отключена сервером')
            tokenMap.delete(token)
        }

        if (tokenMap.size === 0) {
            WebSocketController.userConnections.delete(userId)
        }
    }
}

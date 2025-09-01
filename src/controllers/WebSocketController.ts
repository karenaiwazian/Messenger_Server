import admin from 'firebase-admin'
import { createRequire } from "module"
import { IncomingMessage } from "http"
import { RawData, WebSocket, WebSocketServer } from "ws"
import { WEBSOCKET_PORT } from "../Constants.js"
import { MyWebSocket } from "../interfaces/MyWebSocket.js"
import { Authenticate } from "../middlewares/Authentificate.js"
import { WebSocketActionPayload } from '../interfaces/WebSocketActionPayload.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { WebSocketAction } from '../interfaces/WebSocketAction.js'

export class WebSocketController {

    private authenticate = new Authenticate()

    private static userConnections = new Map<number, Map<string, MyWebSocket>>()

    private webSocketServer = new WebSocketServer({ port: WEBSOCKET_PORT })

    constructor() {
        const requireJSON = createRequire(import.meta.url)
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = path.dirname(__filename)
        const serviceAccountPath = path.resolve(__dirname, '../../config/serviceAccountKey.json')

        const serviceAccount = requireJSON(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        })

        this.webSocketServer.on('connection', this.handleConnection)
    }

    public static sendMessage = <T extends keyof WebSocketActionPayload>(
        action: T,
        data: WebSocketActionPayload[T],
        userId: number
    ) => {
        const messageToSend = {
            action: WebSocketAction[action].toString(),
            data: data
        }

        const jsonMessage = JSON.stringify(messageToSend)

        this.sendMessageToUser(userId, jsonMessage)
    }

    private handleConnection = async (webSocket: WebSocket, request: IncomingMessage) => {
        const ws = webSocket as MyWebSocket

        const requestUrl = request.url || ""
        const url = new URL(requestUrl, `http://${request.headers.host}`)
        const token = url.searchParams.get('token')

        if (!token) {
            ws.close(1008, 'Нет токена')
            console.log("Не удалось подключиться к вебсокету без токена")
            return
        }

        try {
            const isVerify = await this.authenticate.verify(token)

            if (!isVerify.isVerify) {
                ws.close(1008, 'Недопустимый токен')
                console.log("Не удалось подключиться к вебсокету с недопустимым токеном")
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

            console.log(message)
        }
        catch (e) {
            console.log('Обработка сообщения вебсокета', e)
        }
    }

    private static sendMessageToUser(userId: number, message: string) {
        const userSessions = this.userConnections.get(userId)

        if (userSessions) {
            for (const clientWs of userSessions.values()) {
                if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(message)
                }
            }
        }
    }

    private handleConnectionClose = (ws: MyWebSocket) => {
        const userId = ws.userId
        console.log(`Пользователь ${userId} отключился`)

        if (ws.userId && ws.token && WebSocketController.userConnections.has(ws.userId)) {
            const tokenMap = WebSocketController.userConnections.get(ws.userId)

            tokenMap?.delete(ws.token)

            if (tokenMap?.size === 0) {
                WebSocketController.userConnections.delete(ws.userId)
            }
        }
    }
}

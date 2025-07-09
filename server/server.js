import express from 'express'
import jwt from 'jsonwebtoken'
import { WebSocketServer } from 'ws'
import admin from 'firebase-admin';
import { createRequire } from 'module'
import { LRUCache } from 'lru-cache'
import mainRouter from './route.js'
import { getInstance } from './db.js'
import { SERVER_PORT, WEBSOCKET_PORT, JWT_SECRET } from './constants.js'

const requireJSON = createRequire(import.meta.url)
const serviceAccount = requireJSON('./serviceAccountKey.json')

const usernameCache = new LRUCache({
    max: 100_000,
    ttl: 1000 * 60 * 60 * 24
})

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

const app = express()

app.use(express.json())

app.use('/', mainRouter)

const db = await getInstance()

app.listen(SERVER_PORT, () => {
    console.log(`Сервер запущен на http://localhost:${SERVER_PORT}`)
})

const userConnections = new Map()

const wss = new WebSocketServer({ port: WEBSOCKET_PORT })

wss.on('connection', async (ws, request) => {
    const url = new URL(request.url, `http://${request.headers.host}`)
    const token = url.searchParams.get('token')

    if (!token) {
        ws.close(1008, 'Нет токена')
        return
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET)

        const tokenRecord = await db.get(`SELECT * FROM tokens WHERE token = ?`, [token])

        if (!tokenRecord) {
            ws.close(1008, 'Недопустимый токен')
            return
        }

        ws.userId = payload.id.toString()
        ws.token = token

        if (!userConnections.has(ws.userId)) {
            userConnections.set(ws.userId, new Map())
        }
        userConnections.get(ws.userId).set(ws.token, ws)

        console.log(`Пользователь ${payload.id} подключился через WebSocket`)
    } catch (err) {
        ws.close(1008, 'Ошибка проверки токена')
    }

    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data)

            if (message.action == "DISMISS_SESSION") {
                const sessionId = message.data.sessionId

                const token = await db.get('SELECT token FROM tokens WHERE id = ? AND userId = ?', [sessionId, ws.userId])

                disconnectUserByIdAndToken(ws.userId, token.token)

                return
            }

            const targetId = message.receiverId

            const currentUserSessions = userConnections.get(ws.userId)

            const MAX_MESSAGE_LENGTH = 4096

            const parts = []
            const text = message.text
            for (let i = 0; i < text.length; i += MAX_MESSAGE_LENGTH) {
                parts.push(text.slice(i, i + MAX_MESSAGE_LENGTH))
            }

            for (let i = 0; i < parts.length; i++) {
                const partText = parts[i]

                const date = Date.now()

                await db.run(
                    `INSERT INTO messages (senderId, receiverId, text, timestamp) VALUES (?, ?, ?, ?)`,
                    [message.senderId, message.receiverId, partText, date]
                )

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
        catch (e) { console.log(`error + ${e}`) }
    })

    ws.on('close', () => {
        const userId = ws.userId
        console.log(`User ${userId} disconnected`)

        if (ws.userId && ws.token && userConnections.has(ws.userId)) {
            const tokenMap = userConnections.get(ws.userId)

            tokenMap.delete(ws.token)

            if (tokenMap.size === 0) {
                userConnections.delete(ws.userId)
            }
        }
    })
})

async function getUsername(userId) {
    const name = usernameCache.get(userId)

    if (name) {
        return name
    }

    const row = await db.get("SELECT firstName, lastName FROM users WHERE id = ?", userId)
    if (row) {
        const name = `${row.firstName} ${row.lastName}`
        usernameCache.set(userId, name)
        return name
    }

    return "Messenger"
}

async function sendPushToUser(userId, messageText, senderName, chatId) {
    try {
        const rows = await db.all(`SELECT fcmToken FROM tokens WHERE userId = ?`, [userId])
        const tokens = rows.map(row => row.fcmToken)

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

async function disconnectUserByIdAndToken(userId, token) {
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

    await db.run(
        `DELETE FROM tokens WHERE userId = ? AND token = ?`,
        [userId, token]
    )
}

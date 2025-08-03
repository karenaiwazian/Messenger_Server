import { Response } from 'express'
import { MessageService } from '../services/MessageService.js'
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest.js'
import { Message } from '../interfaces/Message.js'
import { ApiReponse } from '../interfaces/ApiResponse.js'
import { NotificationService } from '../services/NotificationService.js'
import { Notification } from '../interfaces/Notification.js'
import { UserService } from '../services/UserService.js'
import { APP_NAME } from '../constants.js'
import { WebSocketController } from '../WebSocket.js'
import { prisma } from '../prisma.js'

export class MessageController {

    private userService = new UserService()
    private messageService = new MessageService()
    private notificationService = new NotificationService()

    sendMessage = async (req: AuthenticatedRequest, res: Response) => {
        const token = req.user.token
        const userId = req.user.id
        const message = req.body as Message
        const chatId = message.chatId
        const messageText = message.text

        const MAX_MESSAGE_LENGTH = 4096
        const messageParts = []

        for (let i = 0; i < messageText.length; i += MAX_MESSAGE_LENGTH) {
            const messagePart = messageText.slice(i, i + MAX_MESSAGE_LENGTH)
            messageParts.push(messagePart)
        }

        try {
            for (let i = 0; i < messageParts.length; i++) {
                const partText = messageParts[i]

                const sentMessage = await this.messageService.addMessage(userId, chatId, partText)

                if (chatId != userId) {
                    const senderName = await this.userService.getChatNameById(message.senderId)

                    const notification: Notification = {
                        title: senderName || APP_NAME,
                        body: partText
                    }

                    await this.notificationService.sendPushNotification(userId, token, chatId, notification)

                    WebSocketController.sendMessageToChat(sentMessage)
                }
            }

            res.json(ApiReponse.Success())
        } catch (error) {
            console.error("Ошибка отправки сообщения " + error)
            res.json(ApiReponse.Error("Ошибка при отправке сообщения"))
        }
    }

    getChatMessages = async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id

        try {
            const user2 = parseInt(req.query.user?.toString() || "")
            const messages = await this.messageService.getChatMessages(userId, user2)
            res.json(messages)
        } catch (error) {
            console.error('Ошибка при получении сообщений:', error)
            res.json(ApiReponse.Error("Ошибка сервера"))
        }
    }

    deleteChatMessages = async (req: AuthenticatedRequest, res: Response) => {
        const currentUserId = req.user.id
        const user2 = parseInt(req.query.user2?.toString() || "")

        try {
            await this.messageService.deleteAllMessagesInChat(currentUserId, user2)
            res.status(200).json({ success: true })
        } catch (error) {
            console.error('Ошибка при удалении сообщений:', error)
            res.status(500).json({ error: 'Ошибка сервера' })
        }
    }
}

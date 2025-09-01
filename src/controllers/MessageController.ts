import { Response } from 'express'
import { MessageService } from '../services/MessageService.js'
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest.js'
import { Message } from '../interfaces/Message.js'
import { ApiReponse } from '../interfaces/ApiResponse.js'
import { NotificationService } from '../services/NotificationService.js'
import { Notification } from '../interfaces/Notification.js'
import { UserService } from '../services/UserService.js'
import { APP_NAME } from '../Constants.js'
import { WebSocketController } from './WebSocketController.js'
import { ChatService } from '../services/ChatService.js'
import { WebSocketAction } from '../interfaces/WebSocketAction.js'
import { ChatType } from '../interfaces/ChatType.js'

export class MessageController {

    private userService = new UserService()
    private chatService = new ChatService()
    private messageService = new MessageService()
    private notificationService = new NotificationService()

    sendMessage = async (req: AuthenticatedRequest, res: Response) => {
        try {
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

            for (let i = 0; i < messageParts.length; i++) {
                const partText = messageParts[i].trim()

                const sentMessage = await this.messageService.addMessage(userId, chatId, partText)

                try {
                    await this.chatService.createChat(userId, chatId, ChatType.User)

                    if (userId != chatId) {
                        await this.chatService.createChat(chatId, userId, ChatType.User)
                    }
                } catch (error) {
                    console.error("Ошибка при добавлении чата", error)
                }

                if (chatId != userId) {
                    WebSocketController.sendMessage(WebSocketAction.NEW_MESSAGE, sentMessage, chatId)

                    const senderName = await this.userService.getChatNameById(message.senderId)

                    const notification: Notification = {
                        title: senderName || APP_NAME,
                        body: partText
                    }

                    await this.notificationService.sendPushNotification(userId, token, chatId, notification)
                }

                res.status(200).json(sentMessage)
            }
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при отправке сообщения"))
            console.error("Ошибка при отправке сообщения " + error)
        }
    }

    getChatMessages = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = parseInt(req.params.id)

            const messages = await this.messageService.getChatMessages(userId, chatId)

            res.json(messages)
        } catch (error) {
            console.error('Ошибка при получении сообщений:', error)
            res.json(ApiReponse.Error("Ошибка сервера"))
        }
    }

    deleteChatMessages = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = parseInt(req.params.id)

            await this.messageService.deleteAllMessagesInChat(userId, chatId)

            res.status(200).json({ success: true })
        } catch (error) {
            console.error('Ошибка при удалении сообщений:', error)
            res.status(500).json({ error: 'Ошибка сервера' })
        }
    }
}

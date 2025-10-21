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
import { WebSocketAction } from '../enums/WebSocketAction.js'
import { ChatType } from '../enums/ChatType.js'
import { ChannelService } from '../services/ChannelService.js'
import { IdGenerator } from '../utils/IdGenerator.js'
import { EntityId } from '../types/EntityId.js'
import { GroupService } from '../services/GroupService.js'

export class MessageController {

    private userService = new UserService()
    private chatService = new ChatService()
    private groupService = new GroupService()
    private channelService = new ChannelService()
    private messageService = new MessageService()
    private notificationService = new NotificationService()

    sendMessage = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const token = req.user.token
            const userId = req.user.id
            const message: Message = req.body
            const chatId = message.chatId
            const messageText = message.text
            const chatType = IdGenerator.detectType(chatId)

            const MAX_MESSAGE_LENGTH = 4096
            const messageParts = []

            for (let i = 0; i < messageText.length; i += MAX_MESSAGE_LENGTH) {
                const messagePart = messageText.slice(i, i + MAX_MESSAGE_LENGTH)
                messageParts.push(messagePart)
            }

            for (let i = 0; i < messageParts.length; i++) {
                const partText = messageParts[i].trim()

                const sentMessage = await this.messageService.addMessage(userId, chatId, partText)

                switch (chatType) {
                    case ChatType.PRIVATE:
                        try {
                            await this.chatService.createChat(userId, chatId)

                            if (userId != chatId) {
                                await this.chatService.createChat(chatId, userId)
                            }
                        } catch (error) {
                            console.error("Ошибка при добавлении чата", error)
                        }
                        break

                    case ChatType.CHANNEL:
                        const subscriberIds = await this.channelService.getSubscribers(chatId)

                        for (const subscriberId of subscriberIds) {
                            if (sentMessage.senderId == subscriberId) {
                                continue
                            }

                            const channelMessage = { ...sentMessage }
                            channelMessage.senderId = sentMessage.chatId

                            WebSocketController.sendMessage(WebSocketAction.NEW_MESSAGE, channelMessage, subscriberId)
                        }

                        const senderName = await this.userService.getChatNameById(message.senderId)

                        const notification: Notification = {
                            title: senderName || APP_NAME,
                            body: partText
                        }

                        await this.notificationService.sendPushNotification(userId, token, chatId, notification)
                        break

                    case ChatType.GROUP:
                        const groupMembersid = await this.groupService.getMembers(chatId)

                        for (const memberId of groupMembersid) {
                            if (sentMessage.senderId == memberId) {
                                continue
                            }

                            const groupMessage = { ...sentMessage }
                            groupMessage.senderId = sentMessage.chatId

                            WebSocketController.sendMessage(WebSocketAction.NEW_MESSAGE, groupMessage, memberId)
                        }
                        break
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
            console.error("Ошибка при отправке сообщения", error)
        }
    }

    getChatMessages = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = EntityId(req.params.id)

            let messages: Message[] = []

            switch (IdGenerator.detectType(chatId)) {
                case ChatType.PRIVATE:
                    messages = await this.messageService.getChatMessages(userId, chatId)
                    break
                case ChatType.CHANNEL:
                    messages = await this.messageService.getChannelMessages(chatId)
                    break
                case ChatType.GROUP:
                    messages = await this.messageService.getGroupMessages(chatId)
                    break
                default:
                    break
            }

            res.json(messages)
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка сервера"))
            console.error('Ошибка при получении сообщений:', error)
        }
    }

    deleteChatMessages = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = EntityId(req.params.id)

            await this.messageService.deleteAllMessagesInChat(userId, chatId)

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при удалении сообщений"))
            console.error('Ошибка при удалении сообщений:', error)
        }
    }
}

import { Response } from 'express'
import { ChatService } from "../services/ChatService.js"
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest.js'
import { ApiReponse } from '../interfaces/ApiResponse.js'
import { WebSocketAction } from '../interfaces/WebSocketAction.js'
import { DeleteChatPayload } from '../interfaces/DeleteChatPayload.js'
import { WebSocketController } from './WebSocketController.js'
import { DeleteMessagePayload } from '../interfaces/DeleteMessagePayload.js'
import { ReadMessagePayload } from '../interfaces/ReadMessagePayload.js'

export class ChatController {

    private chatService = new ChatService()

    getChatInfo = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const chatId = parseInt(req.params.id)

            let chatInfo = null

            if (chatId < 0) {
                chatInfo = await this.chatService.getChannelInfo(userId, chatId)
            }
            else {
                chatInfo = await this.chatService.getChatInfo(userId, chatId)
            }

            if (chatInfo == null) {
                res.status(404).json(null)
                console.error(`Чат ${chatId} не найден`)
                return
            }

            res.status(200).json(chatInfo)
        } catch (error) {
            res.status(400).json(null)
            console.error("Ошибка при получении информации о чате")
        }
    }

    getAllChats = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chats = await this.chatService.getAllChats(userId)

            res.status(200).json(chats)
        } catch {
            res.status(400).json(ApiReponse.Error("Ошибка при получении всех чатов"))
            console.error("Ошибка при получении всех чатов")
        }
    }

    getUnarchivedChats = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chats = await this.chatService.getUnarchivedChats(userId)

            res.status(200).json(chats)
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при получении не архивных чатов"))
            console.error('Ошибка при получении не архивных чатов', error)
        }
    }

    getArchivedChats = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chats = await this.chatService.getArchivedChats(userId)

            res.status(200).json(chats)
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при получении архивных чатов"))
            console.error('Ошибка при получении архивных чатов', error)
        }
    }

    addChatToArchive = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = parseInt(req.params.id)

            await this.chatService.addChatToArchive(userId, chatId)

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при добавлении чата в архив"))
            console.error("Ошибка при добавлении чата в архив", error)
        }
    }

    deleteChatFromArchive = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = parseInt(req.params.id)

            await this.chatService.deleteChatFromArchive(userId, chatId)

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при удалении чата из архива"))
            console.error("Ошибка при удалении чата из архива", error)
        }
    }

    pinChat = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = parseInt(req.params.id)

            if (!chatId) {
                return res.status(400).json({ error: 'Chat ID is required' })
            }

            await this.chatService.pinChat(userId, chatId)

            res.status(200).json({ success: true, message: 'Chat pinned successfully' })
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при закреплении чата"))
            console.error('Error while pinning chat:', error)
        }
    }

    unpinChat = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = parseInt(req.params.id)

            if (!chatId) {
                return res.status(400).json({ error: 'Chat ID is required' })
            }

            await this.chatService.unpinChat(userId, chatId)

            res.status(200).json({ success: true, message: 'Chat unpinned successfully' })
        }
        catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при откреплении чата"))
            console.error('Error while unpinning chat:', error)
        }
    }

    getChatLastMessage = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = parseInt(req.params.chatId)

            const lastMessage = await this.chatService.getChatLastMessage(userId, chatId)

            if (lastMessage == null) {
                return res.status(400).json(null)
            }

            res.status(200).json(lastMessage)
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при получении последнего сообщения чата"))
            console.error("Ошибка при получении последнего сообщения чата", error)
        }
    }

    markAsReadMessage = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = parseInt(req.params.chatId)

            const messageId = parseInt(req.params.messageId)

            await this.chatService.markAsRead(messageId)

            const readMessagePayload: ReadMessagePayload = {
                chatId: userId,
                messageId: messageId
            }

            WebSocketController.sendMessage(WebSocketAction.READ_MESSAGE, readMessagePayload, chatId)

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при прочтении сообщения"))
            console.error("Ошибка при прочтении сообщения", error)
        }
    }

    deleteMessage = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = parseInt(req.params.chatId)

            const messageId = parseInt(req.params.messageId)

            const deleteForAllUsers = req.query.deleteForAllUsers?.toString().trim() === "true"

            const deletedMessage = await this.chatService.deleteMessage(userId, chatId, messageId, deleteForAllUsers)

            if (deletedMessage == null) {
                console.error("Не найдено сообщение для удаления", messageId)
                return res.status(404).json(ApiReponse.Error("Сообщение не найдено"))
            }

            if (deletedMessage && deleteForAllUsers) {
                const payload: DeleteMessagePayload = {
                    chatId: userId,
                    messageId: deletedMessage.id
                }

                WebSocketController.sendMessage(WebSocketAction.DELETE_MESSAGE, payload, chatId)
            }

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при удалении чата"))
            console.error("Ошибка при удалении чата " + error)
        }
    }

    deleteChatMessages = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = parseInt(req.params.id)

            const deleteForReceiver = req.query.deleteForReceiver?.toString().trim() === "true"

            await this.chatService.deleteChatMessages(userId, chatId, deleteForReceiver)

            if (deleteForReceiver) {
                const payload: DeleteChatPayload = {
                    chatId: userId
                }

                WebSocketController.sendMessage(WebSocketAction.DELETE_CHAT, payload, chatId)
            }

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при удалении чата"))
            console.error("Ошибка при удалении чата " + error)
        }
    }

    deleteChat = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = parseInt(req.params.id)

            const deleteForReceiver = req.query.deleteForReceiver?.toString().trim() === "true"

            await this.chatService.deleteChat(userId, chatId)
            await this.chatService.deleteChatMessages(userId, chatId, deleteForReceiver)

            if (deleteForReceiver) {
                await this.chatService.deleteChat(chatId, userId)
                await this.chatService.deleteChatMessages(chatId, userId, deleteForReceiver)

                const payload: DeleteChatPayload = {
                    chatId: userId
                }

                WebSocketController.sendMessage(WebSocketAction.DELETE_CHAT, payload, chatId)
            }

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при удалении чата"))
            console.error("Ошибка при удалении чата " + error)
        }
    }
}

import { Response } from 'express'
import { Chat as ChatService } from "../services/Chat.js"
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest.js'
import { ApiReponse } from '../interfaces/ApiResponse.js'
import { WebSocketAction } from '../interfaces/WebSocketAction.js'
import { DeleteChatPayload } from '../interfaces/DeleteChatPayload.js'
import { WebSocketController } from './WebSocketController.js'
import { DeleteMessagePayload } from '../interfaces/DeleteMessagePayload.js'
import { ReadMessagePayload } from '../interfaces/ReadMessagePayload.js'

export class Chat {

    private chatService = new ChatService()

    getInfo = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const chatId = parseInt(req.params.id)

            const chatInfo = await this.chatService.getInfo(userId, chatId)

            if (chatInfo == null) {
                console.error(`Чат ${chatId} не найден`)
                return res.status(404).json(null)
            }

            res.status(200).json(chatInfo)
        } catch (error) {
            console.error("Ошибка при получении информации о чате")
            res.status(404).json(null)
        }
    }

    getAllChats = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chats = await this.chatService.getAllChats(userId)

            res.json(chats)
        } catch {
            res.json(ApiReponse.Error("Ошибка при получении всех чатов"))
        }
    }

    getUnarchived = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chats = await this.chatService.getUnarchived(userId)

            res.json(chats)
        } catch (error) {
            console.error('Ошибка при получении не архивных чатов', error)
            res.json(ApiReponse.Error("Ошибка при получении не архивных чатов"))
        }
    }

    getArchived = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chats = await this.chatService.getArchived(userId)

            res.json(chats)
        } catch (error) {
            console.error('Ошибка при получении архивных чатов', error)
            res.json(ApiReponse.Error("Ошибка при получении архивных чатов"))
        }
    }

    addToArchive = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = parseInt(req.params.id)

            await this.chatService.addToArchive(userId, chatId)

            res.json(ApiReponse.Success())
        } catch {
            res.json(ApiReponse.Error("Ошибка при добавлении чата в архив"))
        }
    }

    deleteFromArchive = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = parseInt(req.params.id)

            await this.chatService.deleteFromArchive(userId, chatId)

            res.json(ApiReponse.Success())
        } catch {
            res.json(ApiReponse.Error("Ошибка при удалении чата из архива"))
        }
    }

    pin = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = parseInt(req.params.id)

            if (!chatId) {
                return res.status(400).json({ error: 'Chat ID is required' })
            }

            await this.chatService.pin(userId, chatId)

            res.status(200).json({ success: true, message: 'Chat pinned successfully' })
        } catch (error) {
            console.error('Error while pinning chat:', error)
            res.status(500).json(ApiReponse.Error("Ошибка при закреплении чата"))
        }
    }

    unpin = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = parseInt(req.params.id)

            if (!chatId) {
                return res.status(400).json({ error: 'Chat ID is required' })
            }

            await this.chatService.unpin(userId, chatId)

            res.status(200).json({ success: true, message: 'Chat unpinned successfully' })
        }
        catch (error) {
            console.error('Error while unpinning chat:', error)
            res.status(500).json(ApiReponse.Error("Ошибка при откреплении чата"))
        }
    }

    getLastMessage = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const chatId = parseInt(req.params.chatId)

            const lastMessage = await this.chatService.getLastMessage(userId, chatId)

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

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const chatId = parseInt(req.params.id)
            const deleteForReceiver = req.query.deleteForReceiver?.toString().trim() === "true"

            await this.chatService.delete(userId, chatId, deleteForReceiver)

            if (deleteForReceiver) {
                const payload: DeleteChatPayload = {
                    chatId: userId
                }

                WebSocketController.sendMessage(WebSocketAction.DELETE_CHAT, payload, chatId)
            }

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.json(ApiReponse.Error("Ошибка при удалении чата"))
            console.error("Ошибка при удалении чата " + error)
        }
    }
}

import { Response } from 'express'
import { ChatService } from "../services/ChatService.js"
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest.js'
import { ApiReponse } from '../interfaces/ApiResponse.js'
import { ChatInfo } from '../interfaces/ChatInfo.js'

export class ChatController {

    private chatService = new ChatService()

    getAllChats = async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id

        try {
            const chats = await this.chatService.getAllChats(userId)
            res.json(chats)
        } catch {
            res.json(ApiReponse.Error("Ошибка при получении всех чатов"))
        }
    }

    getUnarchivedChats = async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id

        try {
            const chats = await this.chatService.getUnarchivedChats(userId)
            res.json(chats)
        } catch (error) {
            console.error('Ошибка при получении не архивных чатов', error)
            res.json(ApiReponse.Error("Ошибка при получении не архивных чатов"))
        }
    }

    getArchivedChats = async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id

        try {
            const chats = await this.chatService.getArchivedChats(userId)
            res.json(chats)
        } catch (error) {
            console.error('Ошибка при получении архивных чатов', error)
            res.json(ApiReponse.Error("Ошибка при получении архивных чатов"))
        }
    }

    addChatToArchive = async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id

        try {
            const chat = req.body as ChatInfo

            const chatId = chat.id

            await this.chatService.addChatToArchive(userId, chatId)
            await this.chatService.deleteChatFromUnarchive(userId, chatId)

            res.json(ApiReponse.Success())
        }
        catch {
            res.json(ApiReponse.Error("Ошибка при добавлении чата в архив"))
        }
    }

    deleteChatFromArchive = async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id

        try {
            const chat = req.body as ChatInfo

            const chatId = chat.id

            await this.chatService.deleteChatFromArchive(userId, chatId)
            await this.chatService.addChatToUnarchive(userId, chatId)

            res.json(ApiReponse.Success())
        }
        catch {
            res.json(ApiReponse.Error("Ошибка при удалении чата из архива"))
        }
    }

    pinChat = async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id

        try {
            const chat = req.body as ChatInfo

            const chatId = chat.id

            if (!chatId) {
                return res.status(400).json({ error: 'Chat ID is required' })
            }

            const pinResult = await this.chatService.pinChat(userId, chatId)
            res.status(200).json({ success: true, message: 'Chat pinned successfully' })
        }
        catch (error) {
            console.error('Error while pinning chat:', error)
            res.status(500).json({ error: 'Error' })
        }
    }

    unpinChat = async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id

        try {
            const chat = req.body as ChatInfo

            const chatId = chat.id

            if (!chatId) {
                return res.status(400).json({ error: 'Chat ID is required' })
            }

            await this.chatService.unpinChat(userId, chatId)
            res.status(200).json({ success: true, message: 'Chat unpinned successfully' })
        }
        catch (error) {
            console.error('Error while unpinning chat:', error)
            res.status(500).json({ error: 'Error' })
        }
    }
}

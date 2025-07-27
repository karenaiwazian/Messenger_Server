import { Request, Response } from 'express'
import { ChatService } from "../services/ChatService.js"

export class ChatController {
    private chatService: ChatService

    constructor() {
        this.chatService = new ChatService()
    }

    getUnarchivedChats = async (req: Request, res: Response) => {
        const userId = req.user?.id

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' })
        }

        try {
            const chats = await this.chatService.getUnarchivedChats(parseInt(userId))
            res.json(chats)
        } catch (error) {
            console.error('Error while loading unarchive chats:', error)
            res.status(500).json({ error: 'Error' })
        }
    }

    getArchivedChats = async (req: Request, res: Response) => {
        const userId = req.user?.id

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' })
        }

        try {
            const chats = await this.chatService.getArchivedChats(parseInt(userId))
            res.json(chats)
        } catch (error) {
            console.error('Error while loading archive chats:', error)
            res.status(500).json({ error: 'Error' })
        }
    }

    addChatToArchive = async (req: Request, res: Response) => {
        const userId = parseInt(req.user?.id || "")
        const chatId = parseInt(req.body.id)

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' })
        }

        await this.chatService.addChatToArchive(userId, chatId)
        await this.chatService.deleteChatFromUnarchive(userId, chatId)

        res.json({ success: false, message: '' })
    }

    deleteChatFromArchive = async (req: Request, res: Response) => {
        const userId = parseInt(req.user?.id || "")
        const chatId = parseInt(req.body.id)

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' })
        }

        await this.chatService.deleteChatFromArchive(userId, chatId)
        await this.chatService.addChatToUnarchive(userId, chatId)

        res.json({ success: false, message: '' })
    }

    pinChat = async (req: Request, res: Response) => {
        const userId = req.user?.id

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' })
        }

        try {
            const chatId = parseInt(req.body.id)

            if (!chatId) {
                return res.status(400).json({ error: 'Chat ID is required' })
            }

            const pinResult = await this.chatService.pinChat(parseInt(userId), chatId)
            res.status(200).json({ success: true, message: 'Chat pinned successfully' })
        }
        catch (error) {
            console.error('Error while pinning chat:', error)
            res.status(500).json({ error: 'Error' })
        }
    }

    unpinChat = async (req: Request, res: Response) => {
        const userId = req.user?.id

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' })
        }

        try {
            const chatId = req.body.chatId

            if (!chatId) {
                return res.status(400).json({ error: 'Chat ID is required' })
            }

            await this.chatService.unpinChat(parseInt(userId), chatId)
            res.status(200).json({ success: true, message: 'Chat unpinned successfully' })
        }
        catch (error) {
            console.error('Error while unpinning chat:', error)
            res.status(500).json({ error: 'Error' })
        }
    }
}

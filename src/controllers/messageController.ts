import { Request, Response } from 'express'
import { MessageService } from '../services/MessageService.js'

export class MessageController {
    private messageService: MessageService

    constructor(messageService: MessageService) {
        this.messageService = messageService
    }

    getMessages = async (req: Request, res: Response) => {
        const currentUserId = parseInt(req.user?.id || "")
        const user2 = parseInt(req.query.user2?.toString() || "")

        try {
            const messages = await this.messageService.getAllMessages(currentUserId, user2)
            res.json(messages)
        } catch (error) {
            console.error('Ошибка при получении сообщений:', error)
            res.status(500).json({ error: 'Ошибка сервера' })
        }
    }

    deleteChatMessages = async (req: Request, res: Response) => {
        const currentUserId = parseInt(req.user?.id || "")
        const user2 = parseInt(req.query.user2?.toString() || "")

        try {
            await this.messageService.deleteAllMessages(currentUserId, user2)
            res.status(200).json({ success: true })
        } catch (error) {
            console.error('Ошибка при удалении сообщений:', error)
            res.status(500).json({ error: 'Ошибка сервера' })
        }
    }
}

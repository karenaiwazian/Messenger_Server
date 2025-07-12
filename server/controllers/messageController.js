import { getMessages, deleteChat, getContacts } from '../services/messageService.js'

export async function messages(req, res) {
    const currentUserId = req.userId
    const { user2 } = req.query
    const messages = await getMessages(currentUserId, user2)

    res.json(messages)
}

export async function deleteChatHandler(req, res) {
    const userId = req.userId
    const chatId = req.body.chatId
    await deleteChat(userId, chatId)

    res.status(200).json({ success: true })
}

export async function contacts(req, res) {
    const myId = req.userId

    try {
        const users = await getContacts(myId)
        res.json(users)
    } catch (error) {
        console.error('Ошибка при получении контактов:', error)
        res.status(500).json({ error: 'Ошибка сервера' })
    }
}

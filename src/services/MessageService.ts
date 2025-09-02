import { Message } from '../interfaces/Message.js'
import { prisma } from '../Prisma.js'

export class MessageService {

    getChatMessages = async (senderId: number, chatId: number): Promise<Message[]> => {
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    {
                        senderId: senderId,
                        chatId: chatId,
                        deletedBySender: false
                    },
                    {
                        senderId: chatId,
                        chatId: senderId,
                        deletedByReceiver: false
                    }
                ]
            },
            orderBy: {
                sendTime: 'asc'
            },
            select: {
                id: true,
                chatId: true,
                senderId: true,
                sendTime: true,
                text: true,
                isRead: true
            }
        })

        const formattedMessages: Message[] = messages.map(message => {
            return {
                ...message,
                sendTime: message.sendTime.getTime()
            }
        })

        return formattedMessages
    }

    deleteAllMessagesInChat = async (senderId: number, receiverId: number): Promise<void> => {
        await prisma.message.deleteMany({
            where: {
                senderId: senderId,
                chatId: receiverId
            }
        })
    }

    addMessage = async (senderId: number, chatId: number, text: string): Promise<Message> => {
        const createdMessage = await prisma.message.create({
            data: {
                senderId: senderId,
                chatId: chatId,
                text: text,
                isRead: senderId == chatId
            }
        })

        const sentMessage = {
            ...createdMessage,
            sendTime: createdMessage.sendTime.getTime()
        } as Message

        return sentMessage
    }
}

import { Message as MessagePayload } from '../interfaces/Message.js'
import { prisma } from '../Prisma.js'

export class Message {

    getInChat = async (senderId: number, chatId: number): Promise<MessagePayload[]> => {
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

        const formattedMessages: MessagePayload[] = messages.map(message => {
            return {
                ...message,
                sendTime: message.sendTime.getTime()
            }
        })

        return formattedMessages
    }

    deleteAllInChat = async (senderId: number, receiverId: number): Promise<void> => {
        await prisma.message.deleteMany({
            where: {
                senderId: senderId,
                chatId: receiverId
            }
        })
    }

    add = async (senderId: number, chatId: number, text: string): Promise<MessagePayload> => {
        const createdMessage = await prisma.message.create({
            data: {
                senderId: senderId,
                chatId: chatId,
                text: text,
                isRead: senderId == chatId
            }
        })

        const sentMessage: MessagePayload = {
            ...createdMessage,
            sendTime: createdMessage.sendTime.getTime()
        }

        return sentMessage
    }
}

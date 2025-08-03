import { send } from 'process'
import { Message } from '../interfaces/Message.js'
import { prisma } from '../prisma.js'

export class MessageService {

    getChatMessages = async (senderId: number, chatId: number): Promise<Message[]> => {
        return await prisma.message.findMany({
            where: {
                OR: [
                    {
                        senderId: senderId,
                        chatId: chatId
                    },
                    {
                        senderId: chatId,
                        chatId: senderId
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
                messageId: true,
                text: true
            }
        })
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
        const lastMessageId = await prisma.message.count({
            where: {
                senderId: senderId,
                chatId: chatId
            }
        })

        const messageId = lastMessageId ? lastMessageId + 1 : 1

        if (messageId == 1) {
            await prisma.unarchiveChat.create({
                data: {
                    chatId: chatId,
                    userId: senderId
                }
            })

            if (senderId != chatId) {
                await prisma.unarchiveChat.create({
                    data: {
                        chatId: senderId,
                        userId: chatId
                    }
                })
            }
        }

        return await prisma.message.create({
            data: {
                messageId: messageId,
                senderId: senderId,
                chatId: chatId,
                text: text
            }
        })
    }
}

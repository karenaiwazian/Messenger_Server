import { Message } from '../interfaces/Message.js'
import { prisma } from '../prisma.js'

export class MessageService {

    getAllMessages = async (senderId: number, receiverId: number): Promise<Message[]> => {
        return prisma.message.findMany({
            where: {
                senderId: senderId,
                chatId: receiverId
            }, orderBy: {
                sendTime: 'asc'
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

    addMessage = async (senderId: number, chatId: number, text: string) => {
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

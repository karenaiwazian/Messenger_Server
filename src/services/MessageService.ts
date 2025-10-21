import { Message } from '../interfaces/Message.js'
import { prisma } from '../Prisma.js'
import { EntityId } from '../types/EntityId.js'

export class MessageService {

    getChatMessages = async (senderId: EntityId, chatId: EntityId): Promise<Message[]> => {
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

    getChannelMessages = async (channelId: EntityId) => {
        const messages = await prisma.message.findMany({
            where: {
                chatId: channelId,
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

    getGroupMessages = async (groupId: EntityId) => {
        const messages = await prisma.message.findMany({
            where: {
                chatId: groupId,
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

    deleteAllMessagesInChat = async (senderId: EntityId, receiverId: EntityId): Promise<void> => {
        await prisma.message.deleteMany({
            where: {
                senderId: senderId,
                chatId: receiverId
            }
        })
    }

    addMessage = async (senderId: EntityId, chatId: EntityId, text: string): Promise<Message> => {
        const createdMessage = await prisma.message.create({
            data: {
                senderId: senderId,
                chatId: chatId,
                text: text,
                isRead: senderId == chatId
            }
        })

        const sentMessage: Message = {
            ...createdMessage,
            sendTime: createdMessage.sendTime.getTime()
        }

        return sentMessage
    }
}

import { prisma } from "../Prisma.js"
import { ChatInfo } from "../interfaces/ChatInfo.js"
import { Message } from "../interfaces/Message.js"
import { ChatType } from "../enums/ChatType.js"
import { IdGenerator } from "../utils/IdGenerator.js"
import { EntityId } from "../types/EntityId.js"
import { GroupInfo } from "../interfaces/GroupInfo.js"

export class ChatService {

    getAllChats = async (userId: EntityId): Promise<ChatInfo[]> => {
        const unarchiveChats = await this.getUnarchivedChats(userId)
        const archiveChatss = await this.getArchivedChats(userId)

        const allChats = unarchiveChats.concat(archiveChatss)

        return allChats
    }

    getAllChatsWithOtherUser = async (userId: EntityId): Promise<ChatInfo[]> => {
        const chats = await prisma.chat.findMany({
            where: {
                userId: userId
            }
        })

        const filteredChats = chats.filter(chat => chat.chatId.toString().startsWith(IdGenerator.prefixes.user.toString()))

        const chatsInfo = await this.getChatsInfo(userId, filteredChats)

        return this.sortChats(chatsInfo)
    }

    getUnarchivedChats = async (userId: EntityId): Promise<ChatInfo[]> => {
        const unarchiveChats = await this.getChats(userId)

        return unarchiveChats
    }

    getArchivedChats = async (userId: EntityId): Promise<ChatInfo[]> => {
        const archiveChats = await this.getChats(userId, true)

        return archiveChats
    }

    async createChat(userId: EntityId, chatId: EntityId) {
        await prisma.chat.upsert({
            where: {
                userId_chatId: {
                    userId: userId,
                    chatId: chatId
                }
            },
            update: {},
            create: {
                userId: userId,
                chatId: chatId
            }
        })
    }

    addChatToArchive = async (userId: EntityId, chatId: EntityId): Promise<any> => {
        await this.toggleArchiveChat(userId, chatId, true)
    }

    deleteChatFromArchive = async (userId: EntityId, chatId: EntityId): Promise<void> => {
        await this.toggleArchiveChat(userId, chatId, false)
    }

    pinChat = async (userId: EntityId, chatId: EntityId): Promise<void> => {
        await this.togglePinChat(userId, chatId, true)
    }

    unpinChat = async (userId: EntityId, chatId: EntityId): Promise<void> => {
        await this.togglePinChat(userId, chatId, false)
    }

    async getChatLastMessage(senderId: EntityId, chatId: EntityId): Promise<Message | null> {
        const lastMessage = await prisma.message.findFirst({
            where: {
                OR: [
                    {
                        chatId: chatId,
                        senderId: senderId
                    },
                    {
                        chatId: senderId,
                        senderId: chatId
                    }
                ]
            },
            orderBy: {
                sendTime: 'desc',
            }
        })

        if (lastMessage) {
            return {
                ...lastMessage,
                sendTime: lastMessage.sendTime.getTime()
            }
        } else {
            return null
        }
    }

    async markAsRead(messageId: number) {
        await prisma.message.update({
            where: {
                id: messageId
            },
            data: {
                isRead: true
            }
        })
    }

    async deleteMessage(userId: EntityId, chatId: EntityId, messageId: number, deleteForAll: boolean): Promise<Message | null> {
        const deletedMessage = await prisma.message.findFirst({
            where: {
                id: messageId
            }
        })

        if (deletedMessage == null) {
            return null
        }

        const message: Message = {
            ...deletedMessage,
            sendTime: deletedMessage.sendTime.getTime()
        }

        if (deleteForAll) { // Удалить для всех участников чата
            await prisma.message.delete({
                where: {
                    id: deletedMessage.id
                }
            })

            return message
        }

        if (deletedMessage.senderId == userId) { // Если отправитель удаляет сообщение
            if (deletedMessage.deletedByReceiver) { // Полностью удаляет сообщение, если у получателя оно уже удалено
                await prisma.message.delete({
                    where: {
                        id: messageId
                    }
                })

                return message
            }

            await prisma.message.update({ // Удаляет сообщение только у отправителя
                where: {
                    id: messageId,
                },
                data: {
                    deletedBySender: true
                }
            })

            return message
        }

        if (deletedMessage.senderId == chatId) { // Если получатель удаляет сообщение
            if (deletedMessage.deletedBySender) { // Полностью удаляет сообщение, если у отправителя оно уже удалено
                await prisma.message.delete({
                    where: {
                        id: messageId
                    }
                })

                return message
            }

            await prisma.message.update({ // Удаляет сообщение у получателя
                where: {
                    id: messageId
                },
                data: {
                    deletedByReceiver: true
                }
            })

            return message
        }

        return null
    }

    deleteChatWithMessages = async (userId: EntityId, chatId: EntityId, deleteForReceiver: boolean) => {
        await this.deleteChat(userId, chatId)

        if (deleteForReceiver) {
            await this.deleteChat(chatId, userId)
        }

        await this.deleteChatMessages(userId, chatId, deleteForReceiver)
    }

    deleteChat = async (userId: EntityId, chatId: EntityId) => {
        await prisma.chat.delete({
            where: {
                userId_chatId: {
                    userId: userId,
                    chatId: chatId
                }
            }
        })
    }

    async deleteChatMessages(userId: EntityId, chatId: EntityId, deleteForReceiver: boolean): Promise<void> {
        if (deleteForReceiver) {
            await prisma.message.deleteMany({
                where: {
                    OR: [
                        {
                            senderId: userId,
                            chatId: chatId
                        },
                        {
                            senderId: chatId,
                            chatId: userId
                        }
                    ]
                }
            })
        } else {
            await prisma.message.updateMany({
                where: {
                    senderId: userId,
                    chatId: chatId
                },
                data: {
                    deletedBySender: true
                }
            })

            await prisma.message.updateMany({
                where: {
                    senderId: chatId,
                    chatId: userId
                },
                data: {
                    deletedByReceiver: true
                }
            })
        }
    }

    getChatInfo = async (userId: EntityId, chatId: EntityId): Promise<ChatInfo | null> => {
        const chat = await prisma.user.findFirst({
            where: {
                id: chatId
            },
            select: {
                firstName: true,
                lastName: true
            }
        })

        if (chat == null) {
            return null
        }

        const chatInfo: ChatInfo = {
            id: chatId,
            chatName: `${chat.firstName} ${chat.lastName}`,
            isPinned: false,
            lastMessage: await this.getChatLastMessage(userId, chatId)
        }

        return chatInfo
    }

    getChannelInfo = async (userId: EntityId, chatId: EntityId): Promise<ChatInfo | null> => {
        const channel = await prisma.channel.findFirst({
            where: {
                id: chatId
            },
            select: {
                name: true,
            }
        })

        if (channel == null) {
            return null
        }

        const chatInfo: ChatInfo = {
            id: chatId,
            chatName: channel.name,
            isPinned: false,
            lastMessage: await this.getChatLastMessage(userId, chatId)
        }

        return chatInfo
    }

    getGroupInfo = async (userId: EntityId, chatId: EntityId): Promise<ChatInfo | null> => {
        const group = await prisma.group.findFirst({
            where: {
                id: chatId
            },
            select: {
                name: true,

            }
        })

        if (group == null) {
            return null
        }

        const chatInfo: ChatInfo = {
            id: chatId,
            chatName: group.name,
            isPinned: false,
            lastMessage: await this.getChatLastMessage(userId, chatId)
        }

        return chatInfo
    }

    private getChats = async (userId: EntityId, isArchived: boolean = false) => {
        const chats = await prisma.chat.findMany({
            where: {
                userId: userId,
                isArchived: isArchived
            },
            select: {
                chatId: true,
                isPinned: true
            }
        })

        const userChats = await this.getChatsInfo(userId, chats)

        return this.sortChats(userChats)
    }

    private async getChatsInfo(userId: EntityId, chats: {
        chatId: number;
        isPinned: boolean;
    }[]): Promise<ChatInfo[]> {
        const chatsInfo: ChatInfo[] = []

        for await (const chat of chats) {
            let chatInfo: ChatInfo | null = null

            const chatType = IdGenerator.detectType(chat.chatId)

            switch (chatType) {
                case ChatType.PRIVATE:
                    chatInfo = await this.getChatInfo(userId, chat.chatId)
                    break
                case ChatType.CHANNEL:
                    chatInfo = await this.getChannelInfo(userId, chat.chatId)
                    break
                case ChatType.GROUP:
                    chatInfo = await this.getGroupInfo(userId, chat.chatId)
                    break
                default:
                    break
            }

            if (chatInfo == null) {
                continue
            }

            chatInfo.isPinned = chat.isPinned

            chatsInfo.push(chatInfo)
        }

        return chatsInfo
    }

    private sortChats(chats: ChatInfo[]): ChatInfo[] {
        const sortedBySendTime = chats.sort((a, b) => Number(b.lastMessage?.sendTime || 0) - Number(a.lastMessage?.sendTime || 0))

        const sortedByPin = sortedBySendTime.sort((a, b) => Number(b.isPinned) - Number(a.isPinned))

        return sortedByPin
    }

    private async togglePinChat(userId: EntityId, chatId: EntityId, isPinned: boolean): Promise<void> {
        await prisma.chat.updateMany({
            where: {
                userId: userId,
                chatId: chatId
            },
            data: {
                isPinned: isPinned
            }
        })
    }

    private async toggleArchiveChat(userId: EntityId, chatId: EntityId, isArchived: boolean): Promise<void> {
        await prisma.chat.updateMany({
            where: {
                userId: userId,
                chatId: chatId
            },
            data: {
                isArchived: isArchived
            }
        })
    }
}

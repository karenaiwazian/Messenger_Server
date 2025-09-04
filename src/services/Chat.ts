import { prisma } from "../Prisma.js"
import { ChatInfo } from "../interfaces/ChatInfo.js"
import { Message } from "../interfaces/Message.js"
import { ChatType } from "../interfaces/ChatType.js"

export class Chat {

    getAllChats = async (userId: number): Promise<ChatInfo[]> => {
        const unarchiveChats = await this.getUnarchived(userId)
        const archiveChatss = await this.getArchived(userId)

        const allChats = unarchiveChats.concat(archiveChatss)

        return allChats
    }

    getUnarchived = async (userId: number): Promise<Array<ChatInfo>> => {
        const unarchiveChats = await this.getChats(userId)

        return unarchiveChats
    }

    getArchived = async (userId: number): Promise<ChatInfo[]> => {
        const archiveChats = await this.getChats(userId, true)

        return archiveChats
    }

    async create(userId: number, chatId: number, chatType: ChatType) {
        await prisma.chat.upsert({
            where: {
                userId_chatId: {
                    userId: userId,
                    chatId: chatId
                }
            },
            update: {
                chatType: chatType
            },
            create: {
                userId: userId,
                chatId: chatId,
                chatType: chatType
            }
        })
    }

    addToArchive = async (userId: number, chatId: number): Promise<any> => {
        await this.toggleArchive(userId, chatId, true)
    }

    deleteFromArchive = async (userId: number, chatId: number): Promise<void> => {
        await this.toggleArchive(userId, chatId, false)
    }

    pin = async (userId: number, chatId: number): Promise<void> => {
        await this.togglePin(userId, chatId, true)
    }

    unpin = async (userId: number, chatId: number): Promise<void> => {
        await this.togglePin(userId, chatId, false)
    }

    async getLastMessage(senderId: number, chatId: number): Promise<Message | null> {
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

    async deleteMessage(userId: number, chatId: number, messageId: number, deleteForAll: boolean): Promise<Message | null> {
        const deletedMessage = await prisma.message.findFirst({
            where: {
                id: messageId
            }
        })

        if (deletedMessage == null) {
            return null
        }

        const message = {
            ...deletedMessage,
            sendTime: deletedMessage.sendTime.getTime()
        } as Message

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

    async delete(userId: number, chatId: number, deleteForReceiver: boolean): Promise<void> {
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

    getInfo = async (userId: number, chatId: number): Promise<ChatInfo | null> => {
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

        const chatInfo = {
            id: chatId,
            chatName: `${chat.firstName} ${chat.lastName}`,
            lastMessage: await this.getLastMessage(userId, chatId),
            chatType: ChatType.User
        } as ChatInfo

        return chatInfo
    }

    private getChats = async (userId: number, isArchived: boolean = false) => {
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

        const userChats = new Array<ChatInfo>

        for await (const chat of chats) {
            const chatInfo = await this.getInfo(userId, chat.chatId)

            if (chatInfo == null) {
                continue
            }

            chatInfo.isPinned = chat.isPinned
            userChats.push(chatInfo)
        }

        const sortedBySendTime = userChats.sort((a, b) => Number(b.lastMessage?.sendTime) - Number(a.lastMessage?.sendTime))

        const sortedByPin = sortedBySendTime.sort((a, b) => Number(b.isPinned) - Number(a.isPinned))

        return sortedByPin
    }

    private async togglePin(userId: number, chatId: number, isPinned: boolean): Promise<void> {
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

    private async toggleArchive(userId: number, chatId: number, isArchived: boolean): Promise<void> {
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

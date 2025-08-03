import { prisma } from "../prisma.js"
import { ChatInfo } from "../interfaces/ChatInfo.js"

export class ChatService {

    getAllChats = async (userId: number): Promise<ChatInfo[]> => {
        const unarchiveChats = await this.getUnarchivedChats(userId)
        const archiveChatss = await this.getArchivedChats(userId)

        const allChats = unarchiveChats.concat(archiveChatss)
        return allChats
    }

    getUnarchivedChats = async (userId: number): Promise<Array<ChatInfo>> => {
        const unArchiveChats = await prisma.unarchiveChat.findMany({
            where: {
                userId: userId
            },
            select: {
                chatId: true,
                isPinned: true
            },
            orderBy: {
                isPinned: "desc"
            }
        })

        return await this.getChatsInfo(unArchiveChats)
    }

    getArchivedChats = async (userId: number): Promise<ChatInfo[]> => {
        const archiveChats = await prisma.archiveChat.findMany({
            where: {
                userId: userId
            },
            select: {
                chatId: true,
                isPinned: true
            },
            orderBy: {
                isPinned: "desc"
            }
        })

        return await this.getChatsInfo(archiveChats)
    }

    addChatToArchive = async (userId: number, chatId: number): Promise<any> => {
        await prisma.archiveChat.create({
            data: {
                userId: userId,
                chatId: chatId
            }
        })
    }

    deleteChatFromArchive = async (userId: number, chatId: number): Promise<void> => {
        await prisma.archiveChat.deleteMany({
            where: {
                userId: userId,
                chatId: chatId
            }
        })
    }

    addChatToUnarchive = async (userId: number, chatId: number): Promise<void> => {
        await prisma.unarchiveChat.create({
            data: {
                userId: userId,
                chatId: chatId
            }
        })
    }

    deleteChatFromUnarchive = async (userId: number, chatId: number): Promise<void> => {
        await prisma.unarchiveChat.deleteMany({
            where: {
                userId: userId,
                chatId: chatId
            }
        })
    }

    pinChat = async (userId: number, chatId: number): Promise<boolean> => {
        return await this.togglePinChat(userId, chatId, true)
    }

    unpinChat = async (userId: number, chatId: number): Promise<void> => {
        await this.togglePinChat(userId, chatId, false)
    }

    private isArchiveChat = async (userId: number, chatId: number): Promise<boolean> => {
        const chat = await prisma.archiveChat.findFirst({
            where: {
                userId: userId,
                chatId: chatId
            },
            select: {
                id: true
            }
        })

        return chat != null
    }

    private togglePinChat = async (userId: number, chatId: number, isPinned: boolean): Promise<boolean> => {
        const isArchiveChat = await this.isArchiveChat(userId, chatId)

        if (isArchiveChat) {
            const update = await prisma.archiveChat.updateMany({
                where: {
                    userId: userId,
                    chatId: chatId
                },
                data: {
                    isPinned: isPinned
                }
            })

            return update.count > 0
        } else {
            const update = await prisma.unarchiveChat.updateMany({
                where: {
                    userId: userId,
                    chatId: chatId
                },
                data: {
                    isPinned: isPinned
                }
            })

            return update.count > 0
        }
    }

    private getChatsInfo = async (chats: { chatId: number, isPinned: boolean }[]): Promise<ChatInfo[]> => {
        const users = await prisma.user.findMany({
            where: {
                id: {
                    in: chats.map(chat => chat.chatId)
                }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true
            }
        })

        const chatInfo: ChatInfo[] = users.map(user => ({
            id: user.id,
            chatName: `${user.firstName} ${user.lastName}`,
            isPinned: chats.find(chat => chat.chatId === user.id)?.isPinned || false,
        })).sort((a, b) => Number(b.isPinned) - Number(a.isPinned))

        return chatInfo
    }
}

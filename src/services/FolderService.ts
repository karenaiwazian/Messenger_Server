import { ChatInfo } from "../interfaces/ChatInfo.js"
import { ChatFolder } from "../interfaces/ChatFolder.js"
import { prisma } from "../Prisma.js"
import { UserService } from "./UserService.js"
import { ChatService } from "./ChatService.js"
import { ChatType } from "../enums/ChatType.js"

export class FolderService {

    private userService = new UserService()
    private chatService = new ChatService()

    save = async (chatFolder: ChatFolder): Promise<ChatFolder> => {
        const folder = await prisma.chatFolder.upsert({
            create: {
                userId: chatFolder.userId,
                name: chatFolder.name
            },
            update: {
                userId: chatFolder.userId,
                name: chatFolder.name
            },
            where: {
                id: chatFolder.id
            }
        })

        return folder
    }

    delete = async (folderId: number): Promise<void> => {
        await prisma.chatFolder.delete({
            where: {
                id: folderId
            }
        })
    }

    getFolders = async (userId: number): Promise<ChatFolder[]> => {
        return await prisma.chatFolder.findMany({
            where: {
                userId: userId
            }
        })
    }

    getFolder = async (folderId: number): Promise<ChatFolder> => {
        return await prisma.chatFolder.findFirst({
            where: {
                id: folderId
            }
        }) as ChatFolder
    }

    addChatToFolder = async (chatId: number, folderId: number) => {
        await prisma.chatFolderChats.upsert({
            create: {
                chatId: chatId,
                folderId: folderId,
                chatType: ChatType.PRIVATE
            },
            update: {
                chatId: chatId,
                folderId: folderId,
                chatType: ChatType.PRIVATE
            },
            where: {
                id: folderId
            }
        })
    }

    getFolderChats = async (userId: number, folderId: number): Promise<ChatInfo[]> => {
        const chats = await prisma.chatFolderChats.findMany({
            where: {
                folderId
            }
        })

        const chatPromises = chats.map(async chat => {
            const chatName = await this.userService.getChatNameById(chat.chatId) || ""

            return {
                id: chat.chatId,
                chatName: chatName,
                isPinned: chat.isPinned
            }
        })

        const result = await Promise.all(chatPromises) as ChatInfo[]

        for await (const chat of result) {
            chat.lastMessage = await this.chatService.getChatLastMessage(userId, chat.id)
        }

        const sortedBySendTime = result.sort((a, b) => (b.lastMessage?.sendTime || 0) - (a.lastMessage?.sendTime || 0))

        const sortedByPin = sortedBySendTime.sort((a, b) => Number(b.isPinned) - Number(a.isPinned))

        return sortedByPin
    }

    deleteAllFolderChats = async (folderId: number): Promise<void> => {
        await prisma.chatFolderChats.deleteMany({
            where: {
                folderId: folderId
            }
        })
    }

    pinChat = async (folderId: number, chatId: number) => {
        await this.togglePinChat(folderId, chatId, true)
    }

    unpinChat = async (folderId: number, chatId: number) => {
        await this.togglePinChat(folderId, chatId, false)
    }

    private togglePinChat = async (folderId: number, chatId: number, isPinned: boolean) => {
        await prisma.chatFolderChats.updateMany({
            where: {
                folderId: folderId,
                chatId: chatId
            },
            data: {
                isPinned: isPinned
            }
        })
    }
}

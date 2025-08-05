import { ChatInfo } from "../interfaces/ChatInfo.js"
import { ChatFolder } from "../interfaces/ChatFolder.js"
import { prisma } from "../prisma.js"
import { UserService } from "./UserService.js"
import { ChatService } from "./ChatService.js"

export class FolderService {

    private userService = new UserService()
    private chatService = new ChatService()

    createFolder = async (chatFolder: ChatFolder): Promise<ChatFolder> => {
        const createdFolder = await prisma.chatFolder.create({
            data: {
                userId: chatFolder.userId,
                folderName: chatFolder.folderName
            }
        })

        return createdFolder
    }

    deleteFolder = async (folderId: number): Promise<void> => {
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
        await prisma.chatFolderChats.create({
            data: {
                chatId: chatId,
                folderId: folderId
            }
        })
    }

    getFolderChats = async (folderId: number): Promise<ChatInfo[]> => {
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
            chat.lastMessage = await this.chatService.getChatLastMessage(chat.id)
        }

        return result
    }

    deleteAllFolderChats = async (folderId: number): Promise<void> => {
        await prisma.chatFolderChats.deleteMany({
            where: {
                folderId: folderId
            }
        })
    }

    updateFolderName = async (folderId: number, folderName: string): Promise<void> => {
        await prisma.chatFolder.update({
            data: {
                folderName: folderName
            },
            where: {
                id: folderId
            }
        })
    }
}

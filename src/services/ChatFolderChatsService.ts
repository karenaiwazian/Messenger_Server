import { Repository } from "typeorm"
import { ChatFolderChats } from "../entity/ChatFolderChats"

export class ChatFolderChatsService {
    private chatFolderChatsRepository: Repository<ChatFolderChats>

    constructor(chatFolderChatsRepository: Repository<ChatFolderChats>) {
        this.chatFolderChatsRepository = chatFolderChatsRepository
    }

    addChatToFolder = async (chatId: number, folderId: number): Promise<ChatFolderChats> => {
        const chatFolderChat = this.chatFolderChatsRepository.create({ chatId, chatFolderId: folderId })
        return this.chatFolderChatsRepository.save(chatFolderChat)
    }

    removeChatFromFolder = async (chatId: number, folderId: number): Promise<void> => {
        await this.chatFolderChatsRepository.delete({ chatId, chatFolderId: folderId })
    }

    getChatsInFolder = async (folderId: number): Promise<ChatFolderChats[]> => {
        return this.chatFolderChatsRepository.find({ where: { chatFolderId: folderId } })
    }

    pinChatInFolder = async (chatId: number, folderId: number): Promise<void> => {
        await this.chatFolderChatsRepository.update({ chatId, chatFolderId: folderId }, { isPinned: true })
    }

    unpinChatInFolder = async (chatId: number, folderId: number): Promise<void> => {
        await this.chatFolderChatsRepository.update({ chatId, chatFolderId: folderId }, { isPinned: false })
    }
}

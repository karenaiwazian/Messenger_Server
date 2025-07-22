import { Repository } from "typeorm"
import { ArchiveChat } from "../entity/ArchiveChat"

export class ChatService {
    private archiveChatRepository: Repository<ArchiveChat>

    constructor(archiveChatRepository: Repository<ArchiveChat>) {
        this.archiveChatRepository = archiveChatRepository
    }

    addChatToArchive = async (userId: number, chatId: number): Promise<ArchiveChat> => {
        const newChat = this.archiveChatRepository.create({ userId, chatId })
        return this.archiveChatRepository.save(newChat);
    }

    getArchivedChats = async (userId: number): Promise<ArchiveChat[]> => {
        return this.archiveChatRepository.find({ where: { userId } })
    }

    pinChat = async (chatId: number): Promise<void> => {
        await this.archiveChatRepository.update(chatId, { isPinned: true })
    }

    unpinChat = async (chatId: number): Promise<void> => {
        await this.archiveChatRepository.update(chatId, { isPinned: false })
    }

    deleteChatFromArchive = async (chatId: number): Promise<void> => {
        await this.archiveChatRepository.delete(chatId)
    }

    getPinnedChats = async (userId: number): Promise<ArchiveChat[]> => {
        return this.archiveChatRepository.find({ where: { userId, isPinned: true } })
    }

    getUnpinnedChats = async (userId: number): Promise<ArchiveChat[]> => {
        return this.archiveChatRepository.find({ where: { userId, isPinned: false } })
    }
}

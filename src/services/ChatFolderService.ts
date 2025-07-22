import { Repository } from "typeorm"
import { ChatFolder } from "../entity/ChatFolder"

export class ChatFolderService {
    private chatFolderRepository: Repository<ChatFolder>

    constructor(chatFolderRepository: Repository<ChatFolder>) {
        this.chatFolderRepository = chatFolderRepository
    }

    createFolder = async (userId: number, folderName: string): Promise<ChatFolder> => {
        const newFolder = this.chatFolderRepository.create({ userId, folderName })
        return this.chatFolderRepository.save(newFolder)
    }

    getFolders = async (userId: number): Promise<ChatFolder[]> => {
        return this.chatFolderRepository.find({ where: { userId } })
    }

    deleteFolder = async (folderId: number): Promise<void> => {
        await this.chatFolderRepository.delete(folderId)
    }

    updateFolderName = async (folderId: number, newFolderName: string): Promise<void> => {
        await this.chatFolderRepository.update(folderId, { folderName: newFolderName })
    }
}

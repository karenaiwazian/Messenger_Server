import { Response } from "express"
import { FolderService } from "../services/FolderService.js"
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest.js"
import { ApiReponse } from "../interfaces/ApiResponse.js"
import { ChatFolder } from "../interfaces/ChatFolder.js"

export class FolderController {

    private folderService = new FolderService()

    getFolders = async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id

        try {
            const folders = await this.folderService.getFolders(userId)
            res.json(folders)
        } catch (error) {
            console.error("Ошибка при загрузке папок с чатами:", error)
            res.json(ApiReponse.Error("Ошибка при загрузке чатов"))
        }
    }

    getFolderChats = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const folderId = parseInt(req.params.id)
            const folderChats = await this.folderService.getFolderChats(folderId)
            res.json(folderChats)
        } catch (error) {
            console.error("Ошибка при загрузке чатов для папки:", error)
            res.json(ApiReponse.Error("Ошибка при загрузке чатов для папки"))
        }
    }

    saveFolder = async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id
        const folder = req.body as ChatFolder
        folder.userId = userId

        try {
            if (folder.id != 0) {
                await this.folderService.updateFolderName(folder.id, folder.folderName)
            }
            else {
                const createdFolder = await this.folderService.createFolder(folder)
                folder.id = createdFolder.id
            }

            if (folder.chats) {
                await this.folderService.deleteAllFolderChats(folder.id)

                for await (const chat of folder.chats) {
                    await this.folderService.addChatToFolder(chat.id, folder.id)
                }
            }

            res.json(ApiReponse.Success())
        } catch (e: any) {
            console.error("Ошибка при создании/обновлении папки с чатами " + e)
            res.json(ApiReponse.Error("Ошибка при загрузке чатов"))
        }
    }

    deleteFolder = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const folderId = parseInt(req.params.id)
            await this.folderService.deleteFolder(folderId)
            res.json(ApiReponse.Success())
        } catch (error) {
            console.error("Не удалось удалить папку:", error)
            res.json(ApiReponse.Error("Не удалось удалить папку"))
        }
    }
}
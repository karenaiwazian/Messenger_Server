import { Response } from "express"
import { FolderService } from "../services/FolderService.js"
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest.js"
import { ApiReponse } from "../interfaces/ApiResponse.js"
import { ChatFolder } from "../interfaces/ChatFolder.js"

export class FolderController {

    private folderService = new FolderService()

    getFolders = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const folders = await this.folderService.getFolders(userId)

            for await (const folder of folders) {
                folder.chats = await this.folderService.getFolderChats(userId, folder.id)
            }

            res.json(folders)
        } catch (error) {
            console.error("Ошибка при загрузке папок с чатами:", error)
            res.json(ApiReponse.Error("Ошибка при загрузке чатов"))
        }
    }

    getFolderChats = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const folderId = parseInt(req.params.id)
            const folderChats = await this.folderService.getFolderChats(userId, folderId)

            res.json(folderChats)
        } catch (error) {
            console.error("Ошибка при загрузке чатов для папки:", error)
            res.json(ApiReponse.Error("Ошибка при загрузке чатов для папки"))
        }
    }

    save = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const folder = req.body as ChatFolder
            folder.userId = userId

            const savedFolder = await this.folderService.save(folder)
            folder.id = savedFolder.id

            if (folder.chats) {
                await this.folderService.deleteAllFolderChats(folder.id)

                for await (const chat of folder.chats) {
                    await this.folderService.addChatToFolder(chat.id, folder.id)
                }
            }

            res.json(ApiReponse.Success(folder.id.toString()))
        } catch (error) {
            console.error("Ошибка при создании/обновлении папки с чатами " + error)
            res.json(ApiReponse.Error("Ошибка при загрузке чатов"))
        }
    }

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const folderId = parseInt(req.params.id)

            await this.folderService.delete(folderId)

            res.json(ApiReponse.Success())
        } catch (error) {
            console.error("Не удалось удалить папку:", error)
            res.json(ApiReponse.Error("Не удалось удалить папку"))
        }
    }

    pinChat = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const chatId = parseInt(req.params.chatId)
            const folderId = parseInt(req.params.folderId)

            this.folderService.pinChat(folderId, chatId)

            res.status(200).json(ApiReponse.Success())
        } catch (e) {
            res.status(400).json(ApiReponse.Error("Ошибка при закреплении чата в папке"))
            console.error("Ошибка при закреплении чата в папке", e)
        }
    }

    unpinChat = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const chatId = parseInt(req.params.chatId)
            const folderId = parseInt(req.params.folderId)

            this.folderService.unpinChat(folderId, chatId)

            res.status(200).json(ApiReponse.Success())
        } catch (e) {
            res.status(400).json(ApiReponse.Error("Ошибка при откреплении чата в папке"))
            console.error("Ошибка при откреплении чата в папке", e)
        }
    }
}
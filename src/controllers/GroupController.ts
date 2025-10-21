import { Response } from "express"
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest.js"
import { GroupService } from "../services/GroupService.js"
import { ApiReponse } from "../interfaces/ApiResponse.js"
import { GroupInfo } from "../interfaces/GroupInfo.js"
import { IdGenerator } from "../utils/IdGenerator.js"
import { ChatService } from "../services/ChatService.js"
import { EntityId } from "../types/EntityId.js"
import { UserService } from "../services/UserService.js"
import { UserPublicInfo } from "../interfaces/User.js"
import { WebSocketController } from "./WebSocketController.js"
import { WebSocketAction } from "../enums/WebSocketAction.js"
import { ChatInfo } from "../interfaces/ChatInfo.js"
import { DeleteChatPayload } from "../interfaces/DeleteChatPayload.js"

export class GroupController {

    private groupService = new GroupService()
    private chatService = new ChatService()
    private userService = new UserService()

    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const groupInfo: GroupInfo = req.body

            groupInfo.ownerId = userId
            groupInfo.id = IdGenerator.generateGroupId()

            await this.groupService.create(groupInfo)
            await this.groupService.join(userId, groupInfo.id)

            await this.chatService.createChat(userId, groupInfo.id)

            res.status(200).json(ApiReponse.Success(groupInfo.id))
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при создании группы"))
            console.error("Ошибка при создании группы", error)
        }
    }

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const groupId = EntityId(req.params.id)

            await this.groupService.delete(userId, groupId)

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при удалении группы"))
            console.error("Ошибка при удалении группы", error)
        }
    }

    get = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const groupId = EntityId(req.params.id)

            const group = await this.groupService.getById(groupId)

            if (group == null) {
                res.status(404).json(null)
                return
            }

            group.members = (await this.groupService.getMembers(groupId)).length

            res.status(200).json(group)
        } catch (error) {
            console.error("Ошибка при получении канала", error)
        }
    }

    invite = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = EntityId(req.params.userId)
            const groupId = EntityId(req.params.groupId)

            await this.groupService.join(userId, groupId)
            await this.chatService.createChat(userId, groupId)

            const groupInfo = await this.groupService.getById(groupId)

            if (groupInfo != null) {
                const chatInfo: ChatInfo = {
                    id: groupInfo.id,
                    chatName: groupInfo.name,
                    isPinned: false,
                    lastMessage: null
                }

                WebSocketController.sendMessage(WebSocketAction.NEW_CHAT, chatInfo, userId)
            }

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Не удалось добавить участника"))
            console.error("Не удалось добавить участника", error)
        }
    }

    leave = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const groupId = EntityId(req.params.groupId)

            await this.groupService.leave(userId, groupId)
            await this.chatService.deleteChat(userId, groupId)

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при выходе из группы"))
            console.error("Ошибка при выходе из группы", error)
        }
    }

    removeUser = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = EntityId(req.params.userId)
            const groupId = EntityId(req.params.groupId)

            await this.groupService.leave(userId, groupId)
            await this.chatService.deleteChat(userId, groupId)

            const deleteChatPayload: DeleteChatPayload = {
                chatId: groupId
            }

            WebSocketController.sendMessage(WebSocketAction.DELETE_CHAT, deleteChatPayload, userId)

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при выходе из группы"))
            console.error("Ошибка при выходе из группы", error)
        }
    }

    getMembers = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const groupId = EntityId(req.params.id)

            const membersId = await this.groupService.getMembers(groupId)

            const members: UserPublicInfo[] = []

            for await (const id of membersId) {
                const user = await this.userService.getById(id)
                if (user != null) {
                    members.push(user)
                }
            }

            res.json(members)
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при получении учатсников группы"))
            console.error("Ошибка при получении учатсников группы", error)
        }
    }
}
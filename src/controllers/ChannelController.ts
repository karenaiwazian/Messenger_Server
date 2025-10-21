import { Response } from "express"
import { ApiReponse } from "../interfaces/ApiResponse.js"
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest.js"
import { ChannelInfo } from "../interfaces/ChannelInfo.js"
import { ChannelService } from "../services/ChannelService.js"
import { ChatService } from "../services/ChatService.js"
import { UserService } from "../services/UserService.js"
import { UserPublicInfo } from "../interfaces/User.js"
import { ChannelType } from "../enums/ChannelType.js"
import { IdGenerator } from "../utils/IdGenerator.js"
import { EntityId } from "../types/EntityId.js"

export class ChannelController {

    private channelService = new ChannelService()
    private chatService = new ChatService()
    private userService = new UserService()

    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const channel: ChannelInfo = req.body

            channel.ownerId = userId
            channel.publicLink = null
            channel.channelType = ChannelType.PRIVATE
            channel.id = IdGenerator.generateChannelId()

            await this.channelService.create(channel)

            await this.chatService.createChat(userId, channel.id)
            await this.channelService.join(userId, channel.id)

            res.status(200).json(ApiReponse.Success(channel.id))
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при создании канала"))
            console.error("Ошибка при создании канала", error)
        }
    }

    save = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const channel: ChannelInfo = req.body

            channel.ownerId = userId

            if (channel.channelType == ChannelType.PUBLIC) {
                if (channel.publicLink == null) {
                    res.status(400).json(ApiReponse.Error("Необходима публичная ссылка на канал"))
                    return
                }

                if (channel.publicLink.length < 1) {
                    res.status(400).json(ApiReponse.Error("Минимальная длинна публичной ссылки 1 символ"))
                    return
                }
            } else if (channel.channelType == ChannelType.PRIVATE) {
                channel.publicLink = null
            }

            await this.channelService.save(channel)

            res.status(200).json(ApiReponse.Success(channel.id))
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при сохранении канала"))
            console.error("Ошибка при сохранении канала", error)
        }
    }

    checkChannelPublicLink = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const publicLink = req.params.publicLink

            const isBusyByChannel = await this.channelService.checkChannelPubliLink(publicLink)
            const isBusyByUser = await this.userService.checkUsername(publicLink)

            if (isBusyByChannel || !isBusyByUser) {
                res.status(400).json(ApiReponse.Error("Публичная ссылка занята"))
            } else {
                res.status(200).json(ApiReponse.Success())
            }
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при проверке публичной ссылки канала"))
            console.error("Ошибка при проверке публичной ссылки канала", error)
        }
    }

    getById = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const channelId = EntityId(req.params.id)

            const channel = await this.channelService.getById(channelId)

            if (channel == null) {
                return res.status(404).json(ApiReponse.Error("Канал не найден"))
            }

            const isSubscribed = await this.channelService.isSubscribed(userId, channelId)

            channel.isSubscribed = isSubscribed

            res.status(200).json(channel)
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Не удалось найти канал"))
            console.error("Ошибка при получении канала", error)
        }
    }

    getSubscribers = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const channelId = EntityId(req.params.id)

            const subscribersId = await this.channelService.getSubscribers(channelId)

            const subscribeUsers: UserPublicInfo[] = []

            for await (const subscriber of subscribersId) {
                const user = await this.userService.getById(subscriber)

                if (user != null) {
                    subscribeUsers.push(user)
                }
            }

            res.status(200).json(subscribeUsers)
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при получении пдописчиков канала"))
            console.error("Ошибка при получении пдописчиков канала", error)
        }
    }

    join = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const channelId = EntityId(req.params.id)

            await this.channelService.join(userId, channelId)
            await this.chatService.createChat(userId, channelId)

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Не удалось присоединиться к каналу"))
            console.error("Ошибка при присоединении к каналу", error)
        }
    }

    leave = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const channelId = EntityId(req.params.id)

            await this.channelService.leave(userId, channelId)
            await this.chatService.deleteChat(userId, channelId)

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при выходе из канала"))
            console.error("Ошибка при выходе из канала", error)
        }
    }

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const channelId = EntityId(req.params.id)

            await this.channelService.delete(userId, channelId)

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при удалении канала"))
            console.error("Ошибка при удалении канала", error)
        }
    }
}
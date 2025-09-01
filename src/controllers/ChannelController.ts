import { Response } from "express"
import { ApiReponse } from "../interfaces/ApiResponse.js"
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest.js"
import { ChannelInfo } from "../interfaces/ChannelInfo.js"
import { ChannelService } from "../services/ChannelService.js"
import { ChatService } from "../services/ChatService.js"

export class ChannelController {

    private channelService = new ChannelService()
    private chatService = new ChatService()

    createChannel = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const channelInfo = req.body as ChannelInfo

            channelInfo.userId = userId

            await this.channelService.createChannel(channelInfo)

            res.status(200).json(ApiReponse.Success)
        } catch (error) {
            console.error("Ошибка при создании канала", error)
            res.status(400).json(ApiReponse.Error("Ошибка при создании канала"))
        }
    }

    removeChannel = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const channelId = parseInt(req.params.id)

            await this.channelService.removeChannel(channelId)

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            console.error("Ошибка при удалении канала", error)
            res.status(400).json(ApiReponse.Error("Ошибка при удалении канала"))
        }
    }
}
import { prisma } from "../Prisma.js"
import { ChannelInfo } from "../interfaces/ChannelInfo.js"

export class ChannelService {

    createChannel = async (channelInfo: ChannelInfo) => {
        await prisma.channel.create({ data: channelInfo })
    }

    removeChannel = async (channelId: number) => {
        await prisma.channel.delete({
            where: {
                id: channelId
            }
        })
    }
}

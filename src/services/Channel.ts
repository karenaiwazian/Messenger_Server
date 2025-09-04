import { prisma } from "../Prisma.js"
import { ChannelInfo } from "../interfaces/ChannelInfo.js"

export class Channel {

    create = async (channelInfo: ChannelInfo) => {
        await prisma.channel.create({ data: channelInfo })
    }

    remove = async (channelId: number) => {
        await prisma.channel.delete({
            where: {
                id: channelId
            }
        })
    }
}

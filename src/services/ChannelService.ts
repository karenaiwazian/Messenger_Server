import { prisma } from "../Prisma.js"
import { ChannelInfo } from "../interfaces/ChannelInfo.js"

export class ChannelService {

    save = async (channelInfo: ChannelInfo): Promise<number> => {
        const result = await prisma.channel.upsert({
            create: {
                name: channelInfo.name,
                bio: channelInfo.bio,
                ownerId: channelInfo.ownerId,
                channelType: channelInfo.channelType,
                publicLink: channelInfo.publicLink
            },
            update: {
                name: channelInfo.name,
                bio: channelInfo.bio,
                channelType: channelInfo.channelType,
                publicLink: channelInfo.publicLink
            },
            where: {
                id: channelInfo.id
            }
        })

        return result.id
    }

    searchChannels = async (search: string): Promise<ChannelInfo[]> => {
        const channels = await prisma.channel.findMany({
            where: {
                publicLink: {
                    startsWith: search
                }
            }
        })

        return channels as ChannelInfo[]
    }

    checkChannelPubliLink = async (link: string) => {
        const channel = await prisma.channel.count({
            where: {
                publicLink: link
            }
        })

        return channel != 0
    }

    getById = async (channelId: number): Promise<ChannelInfo | null> => {
        const channel = await prisma.channel.findUnique({
            where: {
                id: channelId
            }
        })

        if (channel == null) {
            return null
        }

        const subscribesCount = await prisma.channelSubscriber.count({
            where: {
                channelId: channelId
            }
        })

        const channelInfo = channel as ChannelInfo
        channelInfo.subscribers = subscribesCount

        return channelInfo
    }

    isSubscribed = async (userId: number, channelId: number): Promise<boolean> => {
        const user = await prisma.channelSubscriber.findFirst({
            where: {
                channelId: channelId,
                userId: userId
            }
        })

        return user ? true : false
    }

    getSubscribers = async (channelId: number): Promise<number[]> => {
        const subscribes = await prisma.channelSubscriber.findMany({
            where: {
                channelId: channelId
            },
            select: {
                userId: true
            }
        })

        const userIds = subscribes.map(user => user.userId)

        return userIds
    }

    join = async (userId: number, channelId: number) => {
        await prisma.channelSubscriber.create({
            data: {
                userId: userId,
                channelId: channelId
            }
        })
    }

    leave = async (userId: number, channelId: number) => {
        await prisma.channelSubscriber.delete({
            where: {
                userId_channelId: {
                    userId: userId,
                    channelId: channelId
                }
            }
        })
    }

    remove = async (channelId: number) => {
        await prisma.channel.delete({
            where: {
                id: channelId
            }
        })
    }
}

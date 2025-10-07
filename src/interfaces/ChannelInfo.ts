import { ChannelType } from "../enums/ChannelType"

export type ChannelInfo = {
    id: number
    name: string
    bio: string
    ownerId: number
    subscribers: number
    removedUser: number
    channelType: ChannelType
    publicLink: string | null
    isSubscribed: boolean
}
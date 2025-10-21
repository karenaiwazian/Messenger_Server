import { ChannelType } from "../enums/ChannelType"
import { EntityId } from "../types/EntityId"

export type ChannelInfo = {
    id: EntityId
    name: string
    bio: string
    ownerId: EntityId
    subscribers: number
    removedUser: number
    channelType: ChannelType
    publicLink: string | null
    isSubscribed: boolean
}
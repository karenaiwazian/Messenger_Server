import { EntityId } from "../types/EntityId"

export type Message = {
    id: number
    senderId: EntityId
    chatId: EntityId
    text: string
    sendTime: number
    isRead: boolean
}

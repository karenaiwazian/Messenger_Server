import { EntityId } from "../types/EntityId"
import { Message } from "./Message"

export type ChatInfo = {
    id: EntityId
    chatName: string
    isPinned: boolean
    lastMessage?: Message | null
}

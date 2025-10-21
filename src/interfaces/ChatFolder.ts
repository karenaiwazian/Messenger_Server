import { EntityId } from "../types/EntityId"
import { ChatInfo } from "./ChatInfo"

export type ChatFolder = {
    id: number
    name: string
    userId: EntityId
    chats?: ChatInfo[]
}

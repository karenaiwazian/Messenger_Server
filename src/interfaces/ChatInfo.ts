import { ChatType } from "../enums/ChatType"
import { Message } from "./Message"

export type ChatInfo = {
    id: number
    chatName: string
    chatType: ChatType
    isPinned: boolean
    lastMessage?: Message | null
}

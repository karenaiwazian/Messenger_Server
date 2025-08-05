import { Message } from "./Message"

export type ChatInfo = {
    id: number
    chatName: string
    isPinned: boolean
    lastMessage?: Message | null
}

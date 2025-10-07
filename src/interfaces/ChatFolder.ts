import { ChatInfo } from "./ChatInfo"

export type ChatFolder = {
    id: number
    name: string
    userId: number
    chats?: ChatInfo[]
}

import { ChatInfo } from "./ChatInfo"

export type ChatFolder = {
    id: number
    folderName: string
    userId: number
    chats?: ChatInfo[]
}

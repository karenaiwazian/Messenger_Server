import { EntityId } from "../types/EntityId"

export type DeleteMessagePayload = {
    chatId: EntityId
    messageId: number
}
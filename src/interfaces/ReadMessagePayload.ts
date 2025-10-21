import { EntityId } from "../types/EntityId"

export type ReadMessagePayload = {
    chatId: EntityId
    messageId: number
}
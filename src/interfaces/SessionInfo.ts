import { EntityId } from "../types/EntityId"

export type SessionInfo = {
    id: number
    userId: EntityId
    token: string
    fcmToken: string | null
    deviceName: string
    createdAt: Date
}

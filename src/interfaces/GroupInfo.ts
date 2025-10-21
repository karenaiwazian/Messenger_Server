import { EntityId } from "../types/EntityId"

export type GroupInfo = {
    id: EntityId
    ownerId: EntityId
    name: string
    bio: string
    members: number
}
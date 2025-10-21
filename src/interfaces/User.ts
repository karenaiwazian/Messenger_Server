import { EntityId } from "../types/EntityId"

export type UserFullInfo = {
    id: EntityId
    firstName: string
    lastName: string
    username: string | null
    bio: string
    login: string
    password: string
    dateOfBirth: number | null | undefined
}

export type UserPublicInfo = {
    id: EntityId
    firstName: string
    lastName: string
    username: string | null
    bio: string
    dateOfBirth: number | null
}

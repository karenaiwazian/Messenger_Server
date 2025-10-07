export type UserFullInfo = {
    id: number
    firstName: string
    lastName: string
    username: string | null
    bio: string
    login: string
    password: string
    dateOfBirth: number | null | undefined
}

export type UserPublicInfo = {
    id: number
    firstName: string
    lastName: string
    username: string | null
    bio: string
    dateOfBirth: number | null
}

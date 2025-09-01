import { UserFullInfo, UserPublicInfo } from '../interfaces/User.js'
import { prisma } from "../Prisma.js"

export class UserService {

    getUserById = async (chatId: number): Promise<UserPublicInfo | null> => {
        const user = await prisma.user.findFirst({
            where: {
                id: chatId
            }
        })

        if (!user) {
            return null
        }

        const findedUser = {
            ...user,
            dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).getTime() : undefined
        }

        return findedUser as UserPublicInfo
    }

    getChatNameById = async (chatId: number): Promise<string | null> => {
        const chat = await prisma.user.findFirst({
            where: {
                id: chatId
            },
            select: {
                firstName: true,
                lastName: true
            }
        })

        const chatName = `${chat?.firstName} ${chat?.lastName}`

        if (chatName.trim().length == 0) {
            return null
        }

        return chatName
    }

    getUserByLogin = async (login: string): Promise<UserFullInfo> => {
        return await prisma.user.findFirst({
            where: {
                login: login
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                bio: true,
                login: true,
                password: true,
                dateOfBirth: false
            }
        }) as UserFullInfo
    }

    searchUsers = async (search: string): Promise<UserPublicInfo[]> => {
        return await prisma.user.findMany({
            where: {
                username: {
                    startsWith: search
                }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                bio: true,
                login: true,
                password: true,
                dateOfBirth: false
            }
        }) as UserPublicInfo[]
    }

    checkUsername = async (username: string): Promise<boolean> => {
        const user = await prisma.user.findFirst({
            where: {
                username: username
            }
        })

        return user == null
    }

    async changeUsername(userId: number, username: string | null) {
        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                username: username
            }
        })
    }

    updateUserProfile = async (userId: number, user: UserPublicInfo): Promise<void> => {
        const dateOfBirth = user?.dateOfBirth ? new Date(user.dateOfBirth) : null

        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio,
                username: user.username,
                dateOfBirth: dateOfBirth
            }
        })
    }

    changeCloudPassword = async (userId: number, password: string): Promise<void> => {
        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                password: password
            }
        })
    }

    registerUser = async (user: { login: string, password: string }): Promise<number> => {
        const registeredUser = await prisma.user.create({
            data: {
                login: user.login,
                password: user.password
            }
        })

        return registeredUser.id
    }
}

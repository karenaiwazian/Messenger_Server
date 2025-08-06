import { UserFullInfo, UserPublicInfo } from '../interfaces/User.js'
import { prisma } from "../prisma.js"

export class UserService {

    getUserById = async (chatId: number): Promise<UserPublicInfo> => {
        return await prisma.user.findFirst({
            where: {
                id: chatId
            }
        }) as UserPublicInfo
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
            }
        }) as UserFullInfo
    }

    searchUsers = async (search: string): Promise<UserPublicInfo[]> => {
        return await prisma.user.findMany({
            where: {
                username: {
                    startsWith: search
                }
            }
        }) as UserPublicInfo[]
    }

    updateUserProfile = async (userId: number, user: UserPublicInfo): Promise<void> => {
        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio,
                username: user.username
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

    registerUser = async (user: { login: string, password: string }): Promise<UserFullInfo> => {
        return await prisma.user.create({
            data: {
                login: user.login,
                password: user.password
            }
        }) as UserFullInfo
    }
}

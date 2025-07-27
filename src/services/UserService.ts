import { UserFullInfo, UserPublicInfo } from '../interfaces/User.js'
import { prisma } from "../prisma.js"

export class UserService {

    getUserById = async (id: number): Promise<UserPublicInfo | null> => {
        return await prisma.user.findFirst({ where: { id: id } }) as UserPublicInfo
    }

    getUserByLogin = async (login: string): Promise<UserFullInfo | null> => {
        return await prisma.user.findFirst({ where: { login: login } }) as UserFullInfo | null
    }

    searchUsers = async (search: string): Promise<UserPublicInfo[]> => {
        return await prisma.user.findMany({ where: { username: { startsWith: search } } }) as UserPublicInfo[]
    }

    updateUserProfile = async (userId: number, user: UserPublicInfo): Promise<void> => {
        await prisma.user.update({
            where: { id: userId }, data: {
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio,
                username: user.username
            }
        })
    }

    registerUser = async (user: { login: string, password: string }): Promise<UserFullInfo> => {
        const createdUser = await prisma.user.create({ data: { username: null, login: user.login || "", password: user.password || "" } })
        return createdUser as UserFullInfo
    }
}

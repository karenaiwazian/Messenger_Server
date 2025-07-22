import { In, Repository } from "typeorm"
import { User } from "../entity/User"
import { UserInfo } from '../interfaces/UserInfo.js'
import { Message } from '../entity/Message.js'

export class UserService {
    private userRepository: Repository<User>
    private messageService: Repository<Message>

    constructor(userRepository: Repository<User>, messageRepository: Repository<Message>) {
        this.userRepository = userRepository
        this.messageService = messageRepository
    }

    getUserById = async (id: number): Promise<User | null> => {
        return this.userRepository.findOneBy({ id })
    }

    getUserByLogin = async (login: string): Promise<User | null> => {
        return this.userRepository.findOneBy({ login })
    }

    searchUsers = async (search: string): Promise<User[]> => {
        return this.userRepository.createQueryBuilder("user")
            .where("user.username LIKE :search", { search: `${search}%` })
            .getMany()
    }

    updateUserProfile = async (userId: number, user: Partial<User>): Promise<void> => {
        await this.userRepository.update(userId, {
            firstName: user.firstName,
            lastName: user.lastName,
            bio: user.bio,
            username: user.username
        })
    }

    getAllChats = async (userId: number): Promise<Array<User>> => {
        const messages = await this.messageService.find({
            where: [
                { senderId: userId },
                { receiverId: userId }
            ]
        })

        const interected = new Set<number>()

        messages.forEach((message) => {
            if (message.senderId !== userId) {
                interected.add(message.senderId)
            } else {
                interected.add(message.receiverId)
            }
        })

        const users = await this.userRepository.find({
            where: {
                id: In(Array.from(interected))
            },
            select: ['id', 'firstName', 'lastName']
        })

        return users
    }

    registerUser = async (user: UserInfo): Promise<User> => {
        const newUser = this.userRepository.create(user)
        return this.userRepository.save(newUser)
    }
}

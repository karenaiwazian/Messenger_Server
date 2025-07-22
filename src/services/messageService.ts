import { DeleteResult, Repository } from 'typeorm'
import { Message } from '../entity/Message.js'

export class MessageService {
    private messageRepository: Repository<Message>

    constructor(userRepository: Repository<Message>) {
        this.messageRepository = userRepository
    }

    getAllMessages = async (senderId: number, receiverId: number): Promise<Message[]> => {
        return this.messageRepository.find({ where: { senderId: senderId, receiverId: receiverId }, order: { timestamp: 'ASC' } })
    }

    deleteAllMessages = async (senderId: number, receiverId: number): Promise<DeleteResult> => {
        return await this.messageRepository.delete({ senderId: senderId, receiverId: receiverId })
    }

    addMessage = async (senderId: number, receiverId: number, text: string): Promise<Message> => {
        const message = this.messageRepository.create({ senderId: senderId, receiverId: receiverId, text: text, })
        return await this.messageRepository.save(message)
    }
}

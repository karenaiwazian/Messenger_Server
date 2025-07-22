import { Not, Repository } from 'typeorm'
import { Session } from '../entity/Session.js'
import { SessionInfo } from '../interfaces/SessionInfo.js'

export class SessionService {
    private sessionRepository: Repository<Session>

    constructor(userRepository: Repository<Session>) {
        this.sessionRepository = userRepository
    }

    updateFcmToken = async (token: string, fcmToken: string): Promise<void> => {
        await this.sessionRepository.update({ token }, { fcmToken })
    }

    termitateAllSessions = async (userId: number, token: string): Promise<void> => {
        await this.sessionRepository.delete({ userId, token: token })
    }

    getSessionCount = async (userId: number): Promise<number> => {
        return await this.sessionRepository.count({ where: { userId } })
    }

    getSession = async (sessionId: number, userId: number): Promise<Session | null> => {
        return await this.sessionRepository.findOne({ where: { id: sessionId, userId: userId } })
    }

    getSessions = async (userId: number, token: string): Promise<Array<Session>> => {
        return this.sessionRepository.find({
            where: { userId: userId, token: Not(token) },
            select: ['id', 'deviceName', 'createdAt']
        })
    }

    getUserSessions = async (userId: number): Promise<Array<Session>> => {
        return this.sessionRepository.find({
            where: { userId: userId },
            select: ['id', 'deviceName', 'createdAt']
        })
    }

    deleteSession = async (userId: number, token: string): Promise<void> => {
        await this.sessionRepository.delete({ userId, token })
    }

    addSession = async (session: SessionInfo): Promise<Session> => {
        const newSession = this.sessionRepository.create({ userId: session.userId, token: session.token, fcmToken: session.fcmToken, deviceName: session.deviceName })
        return this.sessionRepository.save(newSession)
    }

    hasSession = async (userId: number, token: string): Promise<boolean> => {
        const session = await this.sessionRepository.findOne({ where: { userId, token } })
        return !!session
    }
}

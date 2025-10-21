import { SessionInfo } from '../interfaces/SessionInfo.js'
import { prisma } from '../Prisma.js'
import { EntityId } from '../types/EntityId.js'

export class SessionService {

    updateFcmToken = async (token: string, fcmToken: string): Promise<void> => {
        await prisma.session.update({
            where: {
                token: token
            },
            data: {
                fcmToken: fcmToken
            }
        })
    }

    termitateAllSessions = async (userId: EntityId, token: string): Promise<void> => {
        await prisma.session.deleteMany({
            where: {
                userId: userId,
                NOT: {
                    token: token
                }
            }
        })
    }

    getSessionCount = async (userId: EntityId): Promise<number> => {
        return await prisma.session.count({
            where: {
                userId
            }
        })
    }

    getSession = async (sessionId: number, userId: EntityId): Promise<SessionInfo | null> => {
        return await prisma.session.findFirst({
            where: {
                id: sessionId, userId: userId
            }
        }) as SessionInfo
    }

    getSessions = async (userId: EntityId, token: string): Promise<SessionInfo[]> => {
        return await prisma.session.findMany({
            where: {
                userId: userId,
                token: {
                    not: token
                }
            }
        }) as SessionInfo[]
    }

    getUserSessions = async (userId: EntityId): Promise<SessionInfo[]> => {
        return await prisma.session.findMany({
            where: {
                userId: userId
            }
        }) as SessionInfo[]
    }

    terminateSessionById = async (sessionId: number): Promise<void> => {
        await prisma.session.delete({
            where: {
                id: sessionId
            }
        })
    }

    terminateSessionByToken = async (token: string): Promise<void> => {
        await prisma.session.delete({
            where: {
                token: token
            }
        })
    }

    addSession = async (session: SessionInfo): Promise<SessionInfo> => {
        const createdSession: SessionInfo = await prisma.session.create({
            data: {
                userId: session.userId,
                token: session.token,
                fcmToken: session.fcmToken,
                deviceName: session.deviceName
            }
        })

        return createdSession
    }

    hasSession = async (userId: EntityId, token: string): Promise<boolean> => {
        return !!await prisma.session.findFirst({
            where: {
                userId: userId,
                token: token
            }
        })
    }
}

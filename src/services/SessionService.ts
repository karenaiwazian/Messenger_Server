import { SessionInfo } from '../interfaces/Session.js'
import { prisma } from '../prisma.js'

export class SessionService {

    updateFcmToken = async (token: string, fcmToken: string): Promise<void> => {
        await prisma.session.update({ where: { token: token }, data: { fcmToken: fcmToken } })
    }

    termitateAllSessions = async (userId: number, token: string): Promise<void> => {
        await prisma.session.deleteMany({ where: { userId: userId } })
    }

    getSessionCount = async (userId: number): Promise<number> => {
        return await prisma.session.count({ where: { userId } })
    }

    getSession = async (sessionId: number, userId: number): Promise<SessionInfo | null> => {
        return await prisma.session.findFirst({ where: { id: sessionId, userId: userId } }) as SessionInfo
    }

    getSessions = async (userId: number, token: string): Promise<Array<SessionInfo>> => {
        return await prisma.session.findMany({
            where: {
                userId: userId,
                token: {
                    not: token
                }
            }
        }) as SessionInfo[]
    }

    getUserSessions = async (userId: number): Promise<Array<SessionInfo>> => {
        return await prisma.session.findMany({
            where: {
                userId: userId
            }
        }) as SessionInfo[]
    }

    deleteSession = async (userId: number, token: string): Promise<void> => {
        await prisma.session.delete({
            where: {
                userId: userId,
                token: token
            }
        })
    }

    addSession = async (session: SessionInfo): Promise<void> => {
        await prisma.session.create({
            data: {
                userId: session.userId,
                token: session.token,
                fcmToken: session.fcmToken,
                deviceName: session.deviceName
            }
        })
    }

    hasSession = async (userId: number, token: string): Promise<boolean> => {
        return !!await prisma.session.findFirst({ where: { userId: userId, token: token } })
    }
}

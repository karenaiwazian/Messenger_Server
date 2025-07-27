import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../constants.js'
import { NextFunction, Request, Response } from 'express'
import { SessionService } from '../services/SessionService.js'

export class Authenticate {
    private sessionService: SessionService

    constructor() {
        this.sessionService = new SessionService()
    }

    authenticate = async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization
        const token = authHeader?.split(' ')[1]

        if (!token) {
            return res.status(401).json({ error: 'token not found' })
        }

        try {
            const checkVerify = await this.verify(token)

            if (!checkVerify.isVerify) {
                return res.status(401).json({ error: 'session not found' })
            }

            req.user = {
                id: checkVerify.userId,
                token: token
            }

            next()
        } catch {
            console.log('token is invalid')
            res.status(403).json({ error: 'token is invalid' })
        }
    }

    verify = async (token: string) => {
        const payload: any = jwt.verify(token, JWT_SECRET)
        const userId = payload.id
        const isVerify = await this.sessionService.hasSession(userId, token)

        return {
            isVerify: isVerify,
            userId: userId
        }
    }
}

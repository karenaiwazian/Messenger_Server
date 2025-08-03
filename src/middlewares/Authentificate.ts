import jwt from 'jsonwebtoken'
import { NextFunction, Request, Response } from 'express'
import { SessionService } from '../services/SessionService.js'
import { ApiReponse } from '../interfaces/ApiResponse.js'
import { JWT_SECRET_KEY } from '../constants.js'

export class Authenticate {

    private sessionService = new SessionService()

    authenticate = async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization
        const token = authHeader?.split(' ')[1]

        if (!token) {
            console.error("Token is undefined")
            return res.status(401).json(ApiReponse.Error("Token is undefined"))
        }

        try {
            const checkVerify = await this.verify(token)

            if (!checkVerify.isVerify) {
                console.error("Session not found")
                return res.status(401).json(ApiReponse.Error("Session not found"))
            }

            req.user = {
                id: checkVerify.userId,
                token: token
            }

            next()
        } catch {
            console.error('Token is invalid')
            res.status(401).json(ApiReponse.Error("Token is invalid"))
        }
    }

    verify = async (token: string) => {
        const payload: any = jwt.verify(token, JWT_SECRET_KEY)
        const userId = payload.id
        const isVerify = await this.sessionService.hasSession(userId, token)

        return {
            isVerify: isVerify,
            userId: userId
        }
    }
}

import jwt, { JwtPayload } from 'jsonwebtoken'
import { NextFunction, Request, Response } from 'express'
import { SessionService } from '../services/SessionService.js'
import { ApiReponse } from '../interfaces/ApiResponse.js'
import { JWT_SECRET_KEY } from '../Constants.js'
import { EntityId } from '../types/EntityId.js'

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
            const { isVerify, userId } = await this.verify(token)

            if (!isVerify) {
                console.error("Session not found")
                return res.status(401).json(ApiReponse.Error("Session not found"))
            }

            req.user = {
                id: userId,
                token: token
            }

            next()
        } catch {
            console.error('Token is invalid')
            res.status(401).json(ApiReponse.Error("Token is invalid"))
        }
    }

    verify = async (token: string) => {
        const payload = jwt.verify(token, JWT_SECRET_KEY!) as JwtPayload
        const userId: EntityId = EntityId(payload.id)
        const isVerify = await this.sessionService.hasSession(userId, token)

        return {
            isVerify: isVerify,
            userId: userId
        }
    }
}

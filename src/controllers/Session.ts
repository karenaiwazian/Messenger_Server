import { Response } from 'express'
import { Session as SessionService } from '../services/Session.js'
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest.js'
import { ApiReponse } from '../interfaces/ApiResponse.js'

export class Session {

    private sessionService = new SessionService()

    updateFcmToken = async (req: AuthenticatedRequest, res: Response) => {
        const token = req.user.token
        const fcmToken = req.body.token

        if (!fcmToken) {
            return res.status(400).json({ success: false, message: 'failure' })
        }

        try {
            await this.sessionService.updateFcmToken(token, fcmToken)
            res.status(200).json({ success: true, message: 'success' })
        } catch (err) {
            res.status(500).json({ success: false, message: 'failure' })
        }
    }

    terminateAll = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const token = req.user.token

            await this.sessionService.termitateAll(userId, token)

            res.status(200).json({ success: true, message: 'All sessions terminated' })
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error terminating sessions' })
        }
    }

    terminate = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const sessionId = parseInt(req.params.id)

            this.sessionService.terminateById(sessionId)

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Error terminating session"))
        }
    }

    getDeviceCount = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const count = await this.sessionService.getSessionCount(userId)

            res.status(200).json(count)
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error fetching device count' })
        }
    }

    getSessions = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const token = req.user.token

            const sessions = await this.sessionService.getSessions(userId, token)

            res.status(200).json(sessions)
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error fetching sessions' })
        }
    }
}

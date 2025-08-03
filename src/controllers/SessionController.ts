import { Response } from 'express'
import { SessionService } from '../services/SessionService.js'
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest.js'

export class SessionController {

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

    terminateAllSessions = async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id
        const token = req.body.token

        if (!token) {
            return res.status(400).json({ success: false, message: 'Token is required' })
        }

        try {
            await this.sessionService.termitateAllSessions(userId, token)
            res.status(200).json({ success: true, message: 'All sessions terminated' })
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error terminating sessions' })
        }
    }

    getDeviceCount = async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id

        try {
            const count = await this.sessionService.getSessionCount(userId)
            res.json({ count })
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error fetching device count' })
        }
    }

    getSessions = async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id
        const token = req.user.token

        try {
            const sessions = await this.sessionService.getSessions(userId, token)
            res.json(sessions)
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error fetching sessions' })
        }
    }
}

import { Request, Response } from 'express'
import { SessionService } from '../services/SessionService.js'

export class SessionController {
    private sessionService: SessionService

    constructor() {
        this.sessionService = new SessionService()
    }

    updateFcmToken = async (req: Request, res: Response) => {
        const fcmToken = req.body.token
        const token = req.user?.token || ""

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

    terminateAllSessions = async (req: Request, res: Response) => {
        const token = req.body.token
        const userId = parseInt(req.user?.id || "")

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

    getDeviceCount = async (req: Request, res: Response) => {
        const userId = req.user?.id || ""
        try {
            const count = await this.sessionService.getSessionCount(parseInt(userId))
            res.json({ count })
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error fetching device count' })
        }
    }

    getSessions = async (req: Request, res: Response) => {
        const userId = req.user?.id || ""
        const token = req.user?.token || ""

        try {
            const sessions = await this.sessionService.getSessions(parseInt(userId), token)
            res.json(sessions)
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error fetching sessions' })
        }
    }
}

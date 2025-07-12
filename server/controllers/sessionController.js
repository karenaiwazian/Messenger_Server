import { updateFcmToken, terminateAllSessions, getSessions, getDeviceCount } from '../services/sessionService.js'

export async function updateFcmTokenHandler(req, res) {
    const fcmToken = req.body.token
    const token = req.token

    if (!fcmToken) {
        return res.status(400).json({ success: false, message: 'failure' })
    }

    try {
        await updateFcmToken(token, fcmToken)
        res.status(200).json({ success: true, message: 'success' })
    } catch (err) {
        res.status(500).json({ success: false, message: 'failure' })
    }
}

export async function terminateAllSessionsHandler(req, res) {
    const token = req.token
    const userId = req.userId

    await terminateAllSessions(token, userId)

    res.status(200).json({ success: true })
}

export async function getSessionsHandler(req, res) {
    const userId = req.userId
    const token = req.token
    const tokens = await getSessions(userId, token)

    res.json(tokens)
}

export async function getDeviceCountHandler(req, res) {
    const userId = req.userId
    const count = await getDeviceCount(userId)

    res.json(count)
}

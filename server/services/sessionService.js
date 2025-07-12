import { getInstance } from '../models/db.js'

const dbPromise = getInstance()

export async function updateFcmToken(token, fcmToken) {
    const db = await dbPromise

    return db.run(
        'UPDATE tokens SET fcmToken = ? WHERE token = ?',
        [fcmToken, token]
    )
}

export async function terminateAllSessions(token, userId) {
    const db = await dbPromise

    return db.run('DELETE FROM tokens WHERE token != ? AND userId = ?', [token, userId])
}

export async function getSessions(userId, token) {
    const db = await dbPromise

    return db.all('SELECT id, deviceName, createdAt FROM tokens WHERE userId = ? AND token != ?', [userId, token])
}

export async function getDeviceCount(userId) {
    const db = await dbPromise

    const response = await db.get('SELECT COUNT(*) AS count FROM tokens WHERE userId = ?', [userId])

    return response.count
}

import { getInstance } from '../models/db.js'

const dbPromise = getInstance()

export async function getMessages(currentUserId, user2) {
    const db = await dbPromise

    return db.all(
        `SELECT * FROM messages 
         WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
         ORDER BY timestamp ASC`,
        [currentUserId, user2, user2, currentUserId]
    )
}

export async function deleteChat(userId, chatId) {
    const db = await dbPromise

    return db.run(
        'DELETE FROM messages WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)',
        [userId, chatId, chatId, userId]
    )
}

export async function getContacts(myId) {
    const db = await dbPromise

    return db.all(
        `SELECT DISTINCT u.id, u.firstName, u.lastName
         FROM users u
         WHERE u.id IN (
             SELECT m.senderId FROM messages m WHERE m.receiverId = ?
             UNION
             SELECT m.receiverId FROM messages m WHERE m.senderId = ?
         )`,
        [myId, myId]
    )
}

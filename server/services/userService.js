import { getInstance } from '../models/db.js'

const dbPromise = getInstance()

export async function getUserProfileById(userId) {
    const db = await dbPromise

    return db.get(
        `SELECT id, firstName, lastName, bio, IFNULL(username, '') AS username FROM users WHERE id = ?`,
        [userId]
    )
}

export async function searchUsers(search) {
    const db = await dbPromise

    return db.all(
        `SELECT id, firstName, lastName, username FROM users WHERE username LIKE ?`,
        [search + "%"]
    )
}

export async function updateUserProfile(userId, { firstName, lastName, username, bio }) {
    const db = await dbPromise

    return db.run(
        `UPDATE users SET firstName = ?, lastName = ?, bio = ?, username = ? WHERE id = ?`,
        [firstName, lastName, bio, username, userId]
    )
}

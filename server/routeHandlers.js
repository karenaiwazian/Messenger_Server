import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getInstance } from './db.js'
import { JWT_SECRET } from './constants.js'

const db = await getInstance()

export async function login(req, res) {
    const { login, password, deviceName } = req.body

    const validLogin = login.trim()
    const validPassword = password.trim()
    const validDeviceName = deviceName.trim()

    const user = await db.get(`SELECT * FROM users WHERE login = ?`, [validLogin])

    if (user && await bcrypt.compare(validPassword, user.password)) {
        const token = jwt.sign({ id: user.id }, JWT_SECRET)

        await db.run(`INSERT INTO tokens (userId, token, deviceName) VALUES (?, ?, ?)`, [user.id, token, validDeviceName])

        res.json({ token })
    } else {
        res.status(401).json({ error: 'Неверный логин или пароль' })
    }
}

export async function register(req, res) {
    const { login, password } = req.body
    const hash = await bcrypt.hash(password, 10)
    try {
        const result = await db.run(
            `INSERT INTO users (login, password) VALUES (?, ?)`,
            [login, hash]
        )

        const token = jwt.sign({ id: result.lastID }, JWT_SECRET)

        res.json({ token })

        console.log('user registered')
    } catch (e) {
        res.status(400).json({ error: 'Пользователь уже существует' })
    }
}

export async function logout(req, res) {
    const userId = req.userId
    const token = req.token
    await db.run(`DELETE FROM tokens WHERE userId = ? AND token = ?`, [userId, token])
    res.status(200).json({})
}

export async function updateFcmToken(req, res) {
    const fcmToken = req.body.token
    const token = req.token

    if (!fcmToken) {
        console.log('Missing parameters')
        return res.status(400).json({ success: false, message: 'failure' })
    }

    try {
        await db.run(
            'UPDATE tokens SET fcmToken = ? WHERE token = ?',
            [fcmToken, token]
        )

        res.status(200).json({ success: true, message: 'success' })
        console.log('success token')
    } catch (err) {
        console.error('DB error:', err)
        res.status(500).json({ success: false, message: 'failure' })
    }
}

export async function deleteChat(req, res) {
    const userId = req.userId
    const chatId = req.body.chatId

    const query = 'DELETE FROM messages WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)'
    await db.run(query, [userId, chatId, chatId, userId])

    res.status(200).json({ success: true })
}

export async function terinameAllSession(req, res) {
    const token = req.token
    const userId = req.userId

    await db.run('DELETE FROM tokens WHERE token != ? AND userId = ?', token, userId)

    res.status(200).json({ success: true })
}

export async function profileUpdate(req, res) {
    const data = req.body
    const userId = req.userId

    const firstName = data.firstName.toString().trim()
    const lastName = data.lastName.toString().trim()
    const username = data.username.toString().trim().length <= 0 ? null : data.username.toString().trim()
    const bio = data.bio.toString().trim()

    await db.run(`
        UPDATE users SET firstName = ?, lastName = ?, bio = ?, username = ? WHERE id = ?
        `, [firstName, lastName, bio, username, userId])
    res.json({ success: true })
}

export async function profile(req, res) {
    const userId = req.userId

    const user = await db.get(
        `SELECT id, firstName, lastName, bio, IFNULL(username, '') AS username FROM users WHERE id = ?`,
        [userId]
    )
    res.json(user || {})
}

export async function searchUser(req, res) {
    const { search } = req.query
    const users = await db.all(
        `SELECT id, firstName, lastName, username FROM users WHERE username LIKE ?`,
        [search + "%"]
    )
    res.json(users)
}

export async function messages(req, res) {
    const currentUserId = req.userId
    const { user1, user2 } = req.query
    const messages = await db.all(
        `SELECT * FROM messages 
         WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
         ORDER BY timestamp ASC`,
        [currentUserId, user2, user2, currentUserId]
    )
    res.json(messages)
}

export async function getSessions(req, res) {
    const userId = req.userId
    const token = req.token

    const query = 'SELECT id, deviceName, createdAt FROM tokens WHERE userId = ? AND token != ?'
    const tokens = await db.all(query, [userId, token])

    res.json(tokens)
}

export async function getDeviceCount(req, res) {
    const userId = req.userId

    const query = 'SELECT COUNT(*) AS count FROM tokens WHERE userId = ?'
    const response = await db.get(query, [userId])

    res.json(response.count)
}

export async function contacts(req, res) {
    const myId = req.userId

    try {
        const users = await db.all(
            `
            SELECT DISTINCT u.id, u.firstName, u.lastName
            FROM users u
            WHERE u.id IN (
                SELECT m.senderId FROM messages m WHERE m.receiverId = ?
                UNION
                SELECT m.receiverId FROM messages m WHERE m.senderId = ?
                )
            `,
            [myId, myId]
        )

        res.json(users)
    } catch (error) {
        console.error('Ошибка при получении контактов:', error)
        res.status(500).json({ error: 'Ошибка сервера' })
    }
}

export async function createChannel(req, res) {
    const { channelName, channelBio } = req.body

    if (channelName == "") {
        res.json({})
        return
    }

    await db.run()

}

export async function createGroup(req, res) {

}

export async function getUserById(req, res) {
    const userId = req.params.id

    const user = await getUserProfileInfoById(userId)
    if (!user) {
        console.log('not found user')
        res.status(404).json({ error: 'Пользователь не найден' })
        return
    }

    res.json(user)
}

export async function findUserByLogin(req, res) {
    const login = req.body.login

    const query = `SELECT id FROM users WHERE login = ?`
    const user = await db.get(query, [login])

    if (!user) {
        res.json({ success: false, message: 'User not found' })
        console.log('user not found by login')
        return
    }

    if (!user.id) {
        res.json({ success: false, message: 'User not found' })
        console.log('user not found by login')
        return
    }

    res.json({ success: true, message: 'User found' })
}

export async function checkHasUserSession(req, res) {

}

export async function checkVerificationCode(req, res) {
    const { login, code } = req.body

    if (code == "123456") {
        res.json({ success: false, message: 'Code is wrong' })
        return
    }

    res.json({ success: true, message: 'Code is success' })
}

async function getUserProfileInfoById(userId) {
    let query = `SELECT id, firstName, lastName, bio, IFNULL(username, '') AS username FROM users WHERE id = ?`

    const user = await db.get(query, [userId])
    return user
}
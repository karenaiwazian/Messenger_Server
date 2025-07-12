import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../constants.js'
import { getInstance } from "../models/db.js"
import { getUserProfileById, searchUsers, updateUserProfile } from '../services/userService.js'

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

export async function searchUser(req, res) {
    const { search } = req.query
    const users = await searchUsers(search)

    res.json(users)
}

export async function profile(req, res) {
    const userId = req.userId

    const user = await db.get(
        `SELECT id, firstName, lastName, bio, IFNULL(username, '') AS username FROM users WHERE id = ?`,
        [userId]
    )

    res.json(user || {})
}

export async function profileUpdate(req, res) {
    const data = req.body
    const userId = req.userId

    const firstName = data.firstName.toString().trim()
    const lastName = data.lastName.toString().trim()
    const username = data.username.toString().trim().length <= 0 ? null : data.username.toString().trim()
    const bio = data.bio.toString().trim()

    await updateUserProfile(userId, { firstName, lastName, username, bio })

    res.json({ success: true })
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

export async function getUserById(req, res) {
    const userId = req.params.id

    const user = await getUserProfileById(userId)

    if (!user) {
        console.log('not found user')
        res.status(404).json({ error: 'Пользователь не найден' })
        return
    }

    res.json(user)
}

export async function checkVerificationCode(req, res) {
    const { login, code } = req.body

    if (code == "123456") {
        res.json({ success: false, message: 'Code is wrong' })
        return
    }

    res.json({ success: true, message: 'Code is success' })
}
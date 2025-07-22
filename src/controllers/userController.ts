import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../constants.js'
import { UserInfo } from '../interfaces/UserInfo.js'

import { Request, Response } from 'express'
import { UserService } from "../services/UserService.js"
import { SessionService } from '../services/SessionService.js'
import { SessionInfo } from '../interfaces/SessionInfo.js'

export class UserController {
    private userService: UserService
    private _sessionService: SessionService

    public get sessionService(): SessionService {
        return this._sessionService
    }

    constructor(userService: UserService, sessionService: SessionService) {
        this.userService = userService
        this._sessionService = sessionService
    }

    getUserById = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id)
            const user = await this.userService.getUserById(id);
            if (user) {
                res.json(user);
            } else {
                res.status(404).json({ message: "User not found" });
            }
        } catch (error: any) {
            res.status(500).json({ message: "Error fetching user by ID", error: error.message });
        }
    }

    searchUsers = async (req: Request, res: Response) => {
        try {
            const search = req.query.search?.toString() || '';
            const users = await this.userService.searchUsers(search);
            res.json(users);
        } catch (error: any) {
            res.status(500).json({ message: "Error searching users", error: error.message });
        }
    }

    logout = async (req: Request, res: Response) => {
        const userId = parseInt(req.user?.id || "")
        const token = req.user?.token || ""

        try {
            await this._sessionService.deleteSession(userId, token)
            res.json({ success: true })
        } catch (error) {
            console.error('Ошибка при выходе из системы:', error)
            res.status(500).json({ error: 'Ошибка сервера' })
        }
    }

    findUserByLogin = async (req: Request, res: Response) => {
        const login = req.body.login

        try {
            const user = await this.userService.getUserByLogin(login)

            if (!user) {
                res.json({ success: false, message: 'Пользователь не найден' })
                console.log('Пользователь не найден по логину')
                return
            }

            res.json({ success: true, message: 'Пользователь найден' })
        } catch (error) {
            console.error('Ошибка при поиске пользователя:', error)
            res.status(500).json({ error: 'Ошибка сервера' })
        }
    }

    profile = async (req: Request, res: Response) => {
        const userId = req.user?.id || ""

        try {
            const user = await this.userService.getUserById(parseInt(userId))

            if (!user) {
                res.status(404).json({ error: 'Пользователь не найден' })
                return
            }

            res.json({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username || '',
                bio: user.bio || ''
            })
        } catch (error) {
            console.error('Ошибка при получении профиля:', error)
            res.status(500).json({ error: 'Ошибка сервера' })
        }
    }


    profileUpdate = async (req: Request, res: Response) => {
        const userId = parseInt(req.user?.id || "")
        const data = req.body

        const user: UserInfo = {
            id: userId,
            firstName: data.firstName.toString().trim(),
            lastName: data.lastName.toString().trim(),
            username: data.username.toString().trim().length <= 0 ? null : data.username.toString().trim(),
            bio: data.bio.toString().trim()
        }

        try {
            await this.userService.updateUserProfile(userId, user)
            res.json({ success: true })
        } catch (error) {
            console.error('Ошибка при обновлении профиля:', error)
            res.status(500).json({ error: 'Ошибка сервера' })
        }
    }


    getAllChats = async (req: Request, res: Response) => {
        const userId = parseInt(req.user?.id || "")

        try {
            const chats = await this.userService.getAllChats(userId)
            res.json(chats)
        } catch (error) {
            console.error('Ошибка при получении контактов:', error)
            res.status(500).json({ error: 'Ошибка сервера' })
        }
    }

    login = async (req: Request, res: Response) => {
        const { login, password, deviceName } = req.body

        if (!password || !login || !deviceName) {
            res.status(401).json({ error: 'Заполните пропуски' })
            return
        }

        const validLogin = login.trim()
        const validPassword = password.trim()
        const validDeviceName = deviceName.trim()

        const user = await this.userService.getUserByLogin(validLogin)

        if (user && user.password && await bcrypt.compare(validPassword, user.password)) {
            const token = jwt.sign({ id: user.id }, JWT_SECRET)

            const sessionInfo: SessionInfo = {
                id: 0,
                userId: user.id,
                deviceName: validDeviceName,
                token: token,
                createdAt: new Date(),
            }

            const addedSession = await this._sessionService.addSession(sessionInfo)

            res.json({ token })
        } else {
            res.status(401).json({ error: 'Неверный логин или пароль' })
        }
    }

    register = async (req: Request, res: Response) => {
        const { login, password, deviceName } = req.body

        if (!login || !password || !deviceName) {
            res.status(400).json({ error: 'Заполните пропуски' })
            return
        }

        const hash = await bcrypt.hash(password, 10)

        try {
            const userInfo: UserInfo = {
                login: login.trim(),
                password: hash,
            }

            const result = await this.userService.registerUser(userInfo)

            const sessionInfo: SessionInfo = {
                id: 0,
                userId: result.id,
                deviceName: deviceName.trim(),
                token: jwt.sign({ id: result.id }, JWT_SECRET),
                createdAt: new Date(),
            }

            const addedSession = await this._sessionService.addSession(sessionInfo)

            res.json({ token: sessionInfo.token })
            console.log('Пользователь зарегистрирован')
        } catch (e) {
            res.status(400).json({ error: 'Пользователь уже существует' })
        }
    }
}

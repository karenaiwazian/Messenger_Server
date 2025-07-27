import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../constants.js'
import { UserFullInfo } from '../interfaces/User.js'
import { Request, Response } from 'express'
import { UserService } from "../services/UserService.js"
import { SessionInfo } from '../interfaces/Session.js'
import { SessionService } from '../services/SessionService.js'
import { MessageService } from '../services/MessageService.js'

export class UserController {

    private userService: UserService
    private sessionService: SessionService
    private chatService: MessageService

    constructor() {
        this.userService = new UserService()
        this.sessionService = new SessionService()
        this.chatService = new MessageService()
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
            await this.sessionService.deleteSession(userId, token)
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

        const user: UserFullInfo = {
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

            const addedSession = await this.sessionService.addSession(sessionInfo)

            res.json({ token })
        } else {
            res.status(401).json({ error: 'Неверный логин или пароль' })
        }
    }

    register = async (req: Request, res: Response) => {
        const { login, password, deviceName } = req.body

        if (!login || !password) {
            res.status(400).json({ error: 'Заполните пропуски' })
            return
        }

        const hash = await bcrypt.hash(password, 10)

        try {
            const registerInfo = {
                login: login.trim(),
                password: hash,
            }

            const registerResult = await this.userService.registerUser(registerInfo)

            const userToken = jwt.sign({ id: registerResult.id }, JWT_SECRET)

            const sessionInfo: SessionInfo = {
                id: 0,
                userId: registerResult.id,
                deviceName: deviceName?.trim() || "",
                token: userToken,
                createdAt: new Date(),
            }

            const addedSession = await this.sessionService.addSession(sessionInfo)

            res.json({ token: sessionInfo.token })
            console.log('Пользователь зарегистрирован')
        } catch (e) {
            res.status(400).json({ error: 'Пользователь уже существует' })
        }
    }
}

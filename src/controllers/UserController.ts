import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { JWT_SECRET_KEY } from '../constants.js'
import { UserFullInfo } from '../interfaces/User.js'
import { Request, Response } from 'express'
import { UserService } from "../services/UserService.js"
import { SessionInfo } from '../interfaces/Session.js'
import { SessionService } from '../services/SessionService.js'
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest.js'
import { ApiReponse } from '../interfaces/ApiResponse.js'

export class UserController {

    private userService = new UserService()
    private sessionService = new SessionService()

    getUserById = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const id = parseInt(req.params.id)
            const user = await this.userService.getUserById(id)

            if (user) {
                res.json(user);
            } else {
                res.status(404).json({ message: "User not found" })
            }
        } catch (error) {
            console.error("Не удалось получить пользователя " + error)
            res.status(500).json(ApiReponse.Error("Не удалось получить пользователя"))
        }
    }

    getMe = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const id = req.user.id
            const user = await this.userService.getUserById(id)

            if (user) {
                res.json(user)
            } else {
                res.status(404).json({ message: "User not found" })
            }
        } catch (error) {
            console.error("Не удалось получить пользователя " + error)
            res.status(500).json(ApiReponse.Error("Не удалось получить пользователя"))
        }
    }

    searchUsers = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const search = req.query.search?.toString() || ''
            const users = await this.userService.searchUsers(search)
            res.json(users);
        } catch (error) {
            console.error("Не удалось найти пользователя " + error)
            res.status(500).json(ApiReponse.Error("Не удалось найти пользователя"))
        }
    }

    findUserByLogin = async (req: Request, res: Response) => {
        try {
            const login: string = req.body.login
            const validLogin = login.trim()
            const user = await this.userService.getUserByLogin(validLogin)

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

    profileUpdate = async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id
        const data = req.body

        const user: UserFullInfo = {
            id: userId,
            firstName: data.firstName?.toString().trim(),
            lastName: data.lastName?.toString().trim(),
            username: data.username?.trim(),
            bio: data.bio?.toString().trim()
        }

        try {
            await this.userService.updateUserProfile(userId, user)
            res.json(ApiReponse.Success())
        } catch (error) {
            console.error('Ошибка при обновлении профиля:', error)
            res.status(500).json(ApiReponse.Error("Не удалось обновить профиль"))
        }
    }

    login = async (req: Request, res: Response) => {
        try {
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
                const token = jwt.sign({ id: user.id }, JWT_SECRET_KEY)

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
        } catch (e) {
            console.error("Ошибка при авторизации", e)
            res.status(400).json(ApiReponse.Error("Ошибка при авторизации"))
        }
    }

    register = async (req: Request, res: Response) => {
        try {
            const { login, password, deviceName } = req.body

            if (!login || !password) {
                res.status(400).json({ error: 'Заполните пропуски' })
                return
            }

            const hash = await bcrypt.hash(password.trim(), 10)

            const registerInfo = {
                login: login.trim(),
                password: hash,
            }

            const registerResult = await this.userService.registerUser(registerInfo)

            const userToken = jwt.sign({ id: registerResult.id }, JWT_SECRET_KEY)

            const sessionInfo: SessionInfo = {
                id: 0,
                userId: registerResult.id,
                deviceName: deviceName?.trim() || "",
                token: userToken,
                createdAt: new Date(),
            }

            res.json({ token: sessionInfo.token })
            console.log('Пользователь зарегистрирован')
        } catch (e) {
            console.error("Ошибка при регистрации", e)
            res.status(400).json(ApiReponse.Error("Ошибка при регистрации"))
        }
    }
}

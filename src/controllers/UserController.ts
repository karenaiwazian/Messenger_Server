import jwt from 'jsonwebtoken'
import { JWT_SECRET_KEY } from '../constants.js'
import { UserFullInfo, UserPublicInfo } from '../interfaces/User.js'
import { Request, Response } from 'express'
import { UserService } from "../services/UserService.js"
import { SessionInfo } from '../interfaces/Session.js'
import { SessionService } from '../services/SessionService.js'
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest.js'
import { ApiReponse } from '../interfaces/ApiResponse.js'
import { CryptoService } from '../utils/CryptoService.js'

export class UserController {

    private userService = new UserService()
    private sessionService = new SessionService()
    private cryptoService = new CryptoService()

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
            const login = req.params.login
            const validLogin = login.trim()
            const user = await this.userService.getUserByLogin(validLogin)

            if (!user) {
                console.log('Пользователь не найден по логину')
                res.status(404).json(ApiReponse.Error("Пользователь не найден"))
                return
            }

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            console.error('Ошибка при поиске пользователя:', error)
            res.status(500).json(ApiReponse.Error("Не удалось найти пользователя"))
        }
    }

    profileUpdate = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const data = req.body as UserPublicInfo

            const user: UserFullInfo = {
                id: userId,
                firstName: data.firstName?.toString().trim(),
                lastName: data.lastName?.toString().trim(),
                username: data.username?.toString().trim(),
                bio: data.bio?.toString().trim(),
                dateOfBirth: data.dateOfBirth
            }

            await this.userService.updateUserProfile(userId, user)
            res.json(ApiReponse.Success())
        } catch (error) {
            console.error('Ошибка при обновлении профиля:', error)
            res.status(500).json(ApiReponse.Error("Не удалось обновить профиль"))
        }
    }

    changeCloudPassword = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const newPassword: string = req.body.newPassword

            const validPassword = newPassword.trim()

            if (validPassword.length < 5) {
                res.status(400).json(ApiReponse.Error("Минимальная длина пароля 5 символов"))
                return
            }

            const passwordHash = await this.cryptoService.hashPassword(validPassword)

            await this.userService.changeCloudPassword(userId, passwordHash)
            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            console.error("Ошибка при смене облачного пароля " + error)
            res.status(400).json(ApiReponse.Error("Ошибка при смене облачного пароля"))
        }
    }

    login = async (req: Request, res: Response) => {
        try {
            const { login, password, deviceName } = req.body

            if (!password || !login || !deviceName) {
                res.status(401).json(ApiReponse.Error("Заполните пропуски"))
                return
            }

            const validLogin = login.trim()
            const validPassword = password.trim()
            const validDeviceName = deviceName.trim()

            const user = await this.userService.getUserByLogin(validLogin)

            if (!user.password) {
                res.status(400).json(ApiReponse.Error(""))
                return
            }

            const isCompare = await this.cryptoService.comparePassword(validPassword, user.password)

            if (isCompare) {
                const token = jwt.sign({ id: user.id }, JWT_SECRET_KEY)

                const sessionInfo: SessionInfo = {
                    id: 0,
                    userId: user.id,
                    deviceName: validDeviceName,
                    token: token,
                    createdAt: new Date(),
                }

                const addedSession = await this.sessionService.addSession(sessionInfo)

                res.status(200).json(ApiReponse.Success(addedSession.token))
            } else {
                console.error("Неверный логин или пароль")
                res.status(401).json(ApiReponse.Error("Неверный логин или пароль"))
            }
        } catch (e) {
            console.error("Ошибка при авторизации", e)
            res.status(400).json(ApiReponse.Error("Ошибка при авторизации"))
        }
    }

    register = async (req: Request, res: Response) => {
        try {
            const login: string = req.body.login
            const password: string = req.body.password

            if (!login || !password) {
                res.status(400).json(ApiReponse.Error("Заполните пропуски"))
                return
            }

            const validLogin = login.trim()
            const validPassword = password.trim()

            if (validLogin.length < 5 || validLogin.length < 5) {
                res.status(400).json(ApiReponse.Error("Логин и пароль должны быть длиннее 5 символов"))
                return
            }

            const hash = await this.cryptoService.hashPassword(validPassword)

            const registerInfo = {
                login: validLogin,
                password: hash,
            }

            const registerResult = await this.userService.registerUser(registerInfo)

            res.status(200).json(ApiReponse.Success())
            console.log('Пользователь зарегистрирован')
        } catch (e) {
            console.error("Ошибка при регистрации", e)
            res.status(400).json(ApiReponse.Error("Ошибка при регистрации"))
        }
    }

    logout = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const token = req.user.token
            await this.sessionService.terminateSessionByToken(token)
            res.json(ApiReponse.Success())
        } catch (error) {
            console.error("Не удалось выйти из аккаунта " + error)
            res.json(ApiReponse.Error("Не удалось выйти из аккаунта"))
        }
    }
}

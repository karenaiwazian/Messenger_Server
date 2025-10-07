import jwt from 'jsonwebtoken'
import { APP_NAME, JWT_SECRET_KEY } from '../Constants.js'
import { UserPublicInfo } from '../interfaces/User.js'
import { Request, Response } from 'express'
import { UserService } from "../services/UserService.js"
import { SessionInfo } from '../interfaces/SessionInfo.js'
import { SessionService } from '../services/SessionService.js'
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest.js'
import { ApiReponse } from '../interfaces/ApiResponse.js'
import { CryptoService } from '../utils/CryptoService.js'
import { PrivacyService } from '../services/PrivacyService.js'
import { PrivacyLevel } from '../interfaces/PrivacyLevel.js'
import { MessageService } from '../services/MessageService.js'
import { ChatService } from '../services/ChatService.js'
import { ChatType } from '../enums/ChatType.js'
import { WebSocketController } from './WebSocketController.js'
import { WebSocketAction } from '../interfaces/WebSocketAction.js'
import { Notification } from '../interfaces/Notification.js'
import { NotificationService } from '../services/NotificationService.js'
import { ChannelService } from '../services/ChannelService.js'
import { SearchInfo } from '../interfaces/SearchInfo.js'

export class UserController {

    private userService = new UserService()
    private sessionService = new SessionService()
    private cryptoService = new CryptoService()
    private privacyService = new PrivacyService()
    private messageService = new MessageService()
    private chatService = new ChatService()
    private channelService = new ChannelService()
    private notificationService = new NotificationService()

    getUserById = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const id = parseInt(req.params.id)

            const user = await this.userService.getById(id)

            if (!user) {
                return res.status(404).json(ApiReponse.Error("Пользователь не найден"))
            }

            const privacy = await this.privacyService.getUserPrivacy(id)

            if (privacy?.bio == PrivacyLevel.Nobody) {
                user.bio = ""
            }

            if (privacy?.dateOfBirth == PrivacyLevel.Nobody) {
                user.dateOfBirth = null
            }

            res.status(200).json(user)
        } catch (error) {
            console.error("Не удалось получить пользователя " + error)
            res.status(500).json(ApiReponse.Error("Не удалось получить пользователя"))
        }
    }

    getMe = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const id = req.user.id

            const user = await this.userService.getById(id)

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

            const channels = await this.channelService.searchChannels(search)

            const find = new Array<SearchInfo>

            users?.forEach(user => {
                find.push({
                    chatId: user.id,
                    name: user.firstName + " " + user.lastName,
                    publicLink: user.username!!
                })
            })

            channels?.forEach(channel => {
                find.push({
                    chatId: -channel.id,
                    name: channel.name,
                    publicLink: channel.publicLink!!
                })
            })

            res.json(find)
        } catch (error) {
            console.error("Не удалось найти пользователя " + error)
            res.status(500).json(ApiReponse.Error("Не удалось найти пользователя"))
        }
    }

    checkUsername = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const username = req.params.username

            const isBusy = await this.userService.checkUsername(username)

            if (isBusy) {
                res.status(400).json(ApiReponse.Error("Имя пользователя занято"))
            } else {
                res.status(200).json(ApiReponse.Success())
            }
        } catch (error) {
            console.error("Ошибка при проверке имени пользователя", error)
            res.status(400).json(ApiReponse.Error("Ошибка при проверке имени пользователя"))
        }
    }

    findUserByLogin = async (req: Request, res: Response) => {
        try {
            const login = req.params.login
            const validLogin = login.trim()

            const user = await this.userService.getByLogin(validLogin)

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

            const user: UserPublicInfo = {
                id: userId,
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
                username: data.username?.trim() || null,
                bio: data.bio.trim(),
                dateOfBirth: data.dateOfBirth
            }

            await this.userService.updateProfile(userId, user)

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

            try {
                const systemChatId = 0

                const token = req.user.token

                const text = "Облачный пароль был изменен"

                const sentMessage = await this.messageService.addMessage(0, userId, text)

                await this.chatService.createChat(userId, systemChatId, ChatType.PRIVATE)

                WebSocketController.sendMessage(WebSocketAction.NEW_MESSAGE, sentMessage, userId)

                const notification: Notification = {
                    title: APP_NAME,
                    body: text
                }

                await this.notificationService.sendPushNotification(systemChatId, token, userId, notification)
            } catch (error) {
                console.error("Не удалось отправить сообщение об изменении облачного пароля ", error)
            }

            await this.userService.changeCloudPassword(userId, passwordHash)

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            res.status(400).json(ApiReponse.Error("Ошибка при смене облачного пароля"))
            console.error("Ошибка при смене облачного пароля " + error)
        }
    }

    changeUsername = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const username = req.params.username

            if (!username) {
                await this.userService.changeUsername(userId, null)
                return res.status(200).json(ApiReponse.Success())
            }

            const validUsername = username.toString().trim()

            if (validUsername.length == 0) {
                await this.userService.changeUsername(userId, null)

                return res.status(200).json(ApiReponse.Success())
            }

            if (validUsername.length > 20) {
                return res.status(400).json(ApiReponse.Error("Максимальная длина имени пользователя 20 символов"))
            }

            if (validUsername.length > 0 && validUsername.length < 5) {
                return res.status(400).json(ApiReponse.Error("Минимальная длина имени пользователя 5 символов"))
            }

            await this.userService.changeUsername(userId, validUsername)

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            console.error("Ошибка при смене имени пользователя " + error)
            res.status(400).json("Ошибка при смене имени пользователя")
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

            const user = await this.userService.getByLogin(validLogin)

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
                    fcmToken: null,
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

            const registeredUserId = await this.userService.register(registerInfo)

            await this.privacyService.initUserPrivacy(registeredUserId)

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

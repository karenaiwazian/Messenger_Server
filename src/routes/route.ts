import { Router } from 'express'
import { Authenticate } from '../middlewares/Authentificate.js'
import { UserController } from "../controllers/UserController.js"
import { MessageController } from '../controllers/MessageController.js'
import { SessionController } from '../controllers/SessionController.js'

export const createMainRouter = (
    userController: UserController,
    messageController: MessageController,
    sessionController: SessionController
): Router => {
    const router = Router()
    const authenticate = new Authenticate(userController.sessionService).authenticate

    // user
    router.post('/login', userController.login)
    router.post('/register', userController.register)
    router.post('/logout', authenticate, userController.logout)
    router.post('/findUserByLogin', userController.findUserByLogin)
    router.get('/searchUser', authenticate, userController.searchUsers)
    router.get('/profile', authenticate, userController.profile)
    router.get('/users/:id', authenticate, userController.getUserById)
    router.put('/profileUpdate', authenticate, userController.profileUpdate)
    router.get('/contacts', authenticate, userController.getAllChats)
    // router.post('/archiveChat', authenticate, userController.archiveChat)
    // router.post('/unArchiveChat', authenticate, userController.unArchiveChat)
    // router.post('/checkVerificationCode', userController.checkVerificationCode)

    // sessions
    router.post('/updateFcmToken', authenticate, sessionController.updateFcmToken)
    router.post('/terminateAllSessions', authenticate, sessionController.terminateAllSessions)
    router.get('/getSessions', authenticate, sessionController.getSessions)
    router.get('/getDeviceCount', authenticate, sessionController.getDeviceCount)

    // channels
    // router.post('/createChannel', authenticate, channelController.createChannelHandler)

    // groups
    // router.post('/createGroup', authenticate, groupController.createGroupHandler)

    // messages
    router.get('/messages', authenticate, messageController.getMessages)
    router.post('/deleteChat', authenticate, messageController.deleteChatMessages)

    return router

}
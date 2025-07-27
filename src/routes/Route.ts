import { Router } from 'express'
import { Authenticate } from '../middlewares/Authentificate.js'
import { UserController } from "../controllers/UserController.js"
import { MessageController } from '../controllers/MessageController.js'
import { SessionController } from '../controllers/SessionController.js'
import { ChatController } from '../controllers/ChatController.js'

export const createMainRouter = (): Router => {
    const userController = new UserController()
    const messageController = new MessageController()
    const sessionController = new SessionController()
    const chatController = new ChatController()

    const router = Router()
    const authenticate = new Authenticate().authenticate

    // user
    router.post('/login', userController.login)
    router.post('/register', userController.register)
    router.post('/logout', authenticate, userController.logout)
    router.post('/findUserByLogin', userController.findUserByLogin)
    router.get('/searchUser', authenticate, userController.searchUsers)
    router.get('/profile', authenticate, userController.profile)
    router.get('/users/:id', authenticate, userController.getUserById)
    router.put('/profileUpdate', authenticate, userController.profileUpdate)

    // chat
    router.get('/archivedChat', authenticate, chatController.getArchivedChats)
    router.get('/unarchivedChat', authenticate, chatController.getUnarchivedChats)
    router.post('/addChatToArchive', authenticate, chatController.addChatToArchive)
    router.post('/deleteChatFromArchive', authenticate, chatController.deleteChatFromArchive)
    router.post('/pinChat', authenticate, chatController.pinChat)
    router.post('/unpinChat', authenticate, chatController.unpinChat)

    // session
    router.post('/updateFcmToken', authenticate, sessionController.updateFcmToken)
    router.post('/terminateAllSessions', authenticate, sessionController.terminateAllSessions)
    router.get('/getSessions', authenticate, sessionController.getSessions)
    router.get('/getDeviceCount', authenticate, sessionController.getDeviceCount)

    // channel
    // router.post('/createChannel', authenticate, channelController.createChannelHandler)

    // group
    // router.post('/createGroup', authenticate, groupController.createGroupHandler)

    // message
    router.get('/messages', authenticate, messageController.getMessages)
    router.post('/deleteChat', authenticate, messageController.deleteChatMessages)

    return router
}

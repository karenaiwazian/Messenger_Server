import { Request, Response, Router } from 'express'
import { Authenticate } from '../middlewares/Authentificate.js'
import { UserController } from "../controllers/UserController.js"
import { MessageController } from '../controllers/MessageController.js'
import { SessionController } from '../controllers/SessionController.js'
import { ChatController } from '../controllers/ChatController.js'
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest.js'
import { FolderController } from '../controllers/FolderController.js'
import { ChannelController } from '../controllers/ChannelController.js'
import { PrivacyController } from '../controllers/PrivacyController.js'

type AuthenticateHandler = (req: AuthenticatedRequest, res: Response) => void

function wrap(handler: AuthenticateHandler) {
    return (req: Request, res: Response) => {
        handler(req as AuthenticatedRequest, res)
    }
}

export const createApiRouter = (): Router => {
    const userController = new UserController()
    const messageController = new MessageController()
    const sessionController = new SessionController()
    const chatController = new ChatController()
    const folderController = new FolderController()
    const channelController = new ChannelController()
    const privacyController = new PrivacyController()

    const authenticate = new Authenticate().authenticate

    const router = Router()

    // user
    router.post('/login', userController.login)
    router.post('/register', userController.register)
    router.delete('/logout', authenticate, wrap(userController.logout))
    router.get('/findUserByLogin/:login', userController.findUserByLogin)
    router.get('/searchUser', authenticate, wrap(userController.searchUsers))
    router.get('/me', authenticate, wrap(userController.getMe))
    router.get('/user/:id', authenticate, wrap(userController.getUserById))
    router.put('/profileUpdate', authenticate, wrap(userController.profileUpdate))
    router.patch('/changeCloudPassword', authenticate, wrap(userController.changeCloudPassword))
    router.patch('/me/username/:username', authenticate, wrap(userController.changeUsername))
    router.patch('/me/username/', authenticate, wrap(userController.changeUsername))

    router.get('/me/privacy', authenticate, wrap(privacyController.getMyPrivacy))
    router.patch('/userPrivacy/bio/:value', authenticate, wrap(privacyController.setBio))
    router.patch('/userPrivacy/dateOfBirth/:value', authenticate, wrap(privacyController.setDateOfBirth))
    router.get('/checkUsername/:username', authenticate, wrap(userController.checkUsername))

    // chat
    router.get('/chats', authenticate, wrap(chatController.getAllChats))
    router.get('/chat/:id', authenticate, wrap(chatController.getChatInfo))
    router.get('/archivedChat', authenticate, wrap(chatController.getArchivedChats))
    router.get('/unarchivedChat', authenticate, wrap(chatController.getUnarchivedChats))
    router.delete('/chat/:id', authenticate, wrap(chatController.deleteChat))
    router.post('/chat/:id/archive', authenticate, wrap(chatController.addChatToArchive))
    router.delete('/chat/:id/archive', authenticate, wrap(chatController.deleteChatFromArchive))
    router.post('/chat/:id/pin', authenticate, wrap(chatController.pinChat))
    router.delete('/chat/:id/pin', authenticate, wrap(chatController.unpinChat))
    router.get('/chat/:id/messages', authenticate, wrap(messageController.getChatMessages))
    router.post('/message', authenticate, wrap(messageController.sendMessage))
    router.delete('/chat/:chatId/messages/:messageId', authenticate, wrap(chatController.deleteMessage))
    router.get('/chat/:chatId/messages/last', authenticate, wrap(chatController.getChatLastMessage))
    router.patch('/chat/:chatId/messages/:messageId/read', authenticate, wrap(chatController.markAsReadMessage))

    // session
    router.post('/updateFcmToken', authenticate, wrap(sessionController.updateFcmToken))
    router.get('/sessions', authenticate, wrap(sessionController.getSessions))
    router.get('/sessionCount', authenticate, wrap(sessionController.getDeviceCount))
    router.delete('/session/:id', authenticate, wrap(sessionController.terminateSession))
    router.delete('/terminateAllSessions', authenticate, wrap(sessionController.terminateAllSessions))

    // folder
    router.post('/folder', authenticate, wrap(folderController.saveFolder))
    router.get('/folders', authenticate, wrap(folderController.getFolders))
    router.delete('/folder/:id', authenticate, wrap(folderController.deleteFolder))
    router.get('/folder/:id/chats', authenticate, wrap(folderController.getFolderChats))
    router.post('/folders/:folderId/chats/:chatId/pin', authenticate, wrap(folderController.pinChat))
    router.delete('/folders/:folderId/chats/:chatId/pin', authenticate, wrap(folderController.unpinChat))

    // channel
    router.post('/channel', authenticate, wrap(channelController.createChannel))
    router.delete('/channel/:id', authenticate, wrap(channelController.removeChannel))

    // group
    // router.post('/createGroup', authenticate, groupController.createGroupHandler)

    return router
}

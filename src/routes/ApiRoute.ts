import { Request, Response, Router } from 'express'
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

    const router = Router()

    // user
    router.delete('/logout', wrap(userController.logout))
    router.get('/searchUser', wrap(userController.searchUsers))
    router.get('/me', wrap(userController.getMe))
    router.get('/user/:id', wrap(userController.getUserById))
    router.put('/profileUpdate', wrap(userController.profileUpdate))
    router.patch('/changeCloudPassword', wrap(userController.changeCloudPassword))
    router.patch('/me/username/:username', wrap(userController.changeUsername))
    router.patch('/me/username/', wrap(userController.changeUsername))

    router.get('/me/privacy', wrap(privacyController.getMyPrivacy))
    router.patch('/userPrivacy/bio/:value', wrap(privacyController.setBio))
    router.patch('/userPrivacy/dateOfBirth/:value', wrap(privacyController.setDateOfBirth))
    router.get('/checkUsername/:username', wrap(userController.checkUsername))

    // chat
    router.get('/chats', wrap(chatController.getAllChats))
    router.get('/chat/:id', wrap(chatController.getChatInfo))
    router.get('/archivedChat', wrap(chatController.getArchivedChats))
    router.get('/unarchivedChat', wrap(chatController.getUnarchivedChats))
    router.delete('/chat/:id', wrap(chatController.deleteChat))
    router.post('/chat/:id/archive', wrap(chatController.addChatToArchive))
    router.delete('/chat/:id/archive', wrap(chatController.deleteChatFromArchive))
    router.post('/chat/:id/pin', wrap(chatController.pinChat))
    router.delete('/chat/:id/pin', wrap(chatController.unpinChat))
    router.get('/chat/:id/messages', wrap(messageController.getChatMessages))
    router.post('/message', wrap(messageController.sendMessage))
    router.delete('/chat/:chatId/messages/:messageId', wrap(chatController.deleteMessage))
    router.get('/chat/:chatId/messages/last', wrap(chatController.getChatLastMessage))
    router.patch('/chat/:chatId/messages/:messageId/read', wrap(chatController.markAsReadMessage))

    // session
    router.post('/updateFcmToken', wrap(sessionController.updateFcmToken))
    router.get('/sessions', wrap(sessionController.getSessions))
    router.get('/sessionCount', wrap(sessionController.getDeviceCount))
    router.delete('/session/:id', wrap(sessionController.terminateSession))
    router.delete('/terminateAllSessions', wrap(sessionController.terminateAllSessions))

    // folder
    router.post('/folder', wrap(folderController.saveFolder))
    router.get('/folders', wrap(folderController.getFolders))
    router.delete('/folder/:id', wrap(folderController.deleteFolder))
    router.get('/folder/:id/chats', wrap(folderController.getFolderChats))
    router.post('/folders/:folderId/chats/:chatId/pin', wrap(folderController.pinChat))
    router.delete('/folders/:folderId/chats/:chatId/pin', wrap(folderController.unpinChat))

    // channel
    router.post('/channel', wrap(channelController.createChannel))
    router.delete('/channel/:id', wrap(channelController.removeChannel))

    // group
    // router.post('/createGroup', authenticate, groupController.createGroupHandler)

    return router
}

import { Request, Response, Router } from 'express'
import { User as UserController } from "../controllers/User.js"
import { Message as MessageController } from '../controllers/Message.js'
import { Session as SessionController } from '../controllers/Session.js'
import { Chat as ChatController } from '../controllers/Chat.js'
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest.js'
import { Folder as FolderController } from '../controllers/Folder.js'
import { Channel as ChannelService } from '../controllers/Channel.js'
import { Privacy as PrivacyController } from '../controllers/Privacy.js'

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
    const channelController = new ChannelService()
    const privacyController = new PrivacyController()

    const router = Router()

    // user
    router.delete('/logout', wrap(userController.logout))
    router.get('/searchUser', wrap(userController.searchUsers))
    router.get('/me', wrap(userController.getMe))
    router.get('/user/:id', wrap(userController.getById))
    router.put('/profileUpdate', wrap(userController.profileUpdate))
    router.patch('/changeCloudPassword', wrap(userController.changeCloudPassword))
    router.patch('/me/username/:username', wrap(userController.changeUsername))
    router.patch('/me/username/', wrap(userController.changeUsername))

    router.get('/me/privacy', wrap(privacyController.getMy))
    router.patch('/userPrivacy/bio/:value', wrap(privacyController.setBio))
    router.patch('/userPrivacy/dateOfBirth/:value', wrap(privacyController.setDateOfBirth))
    router.get('/checkUsername/:username', wrap(userController.checkUsername))

    // chat
    router.get('/chats', wrap(chatController.getAllChats))
    router.get('/chat/:id', wrap(chatController.getInfo))
    router.get('/archivedChat', wrap(chatController.getArchived))
    router.get('/unarchivedChat', wrap(chatController.getUnarchived))
    router.delete('/chat/:id', wrap(chatController.delete))
    router.post('/chat/:id/archive', wrap(chatController.addToArchive))
    router.delete('/chat/:id/archive', wrap(chatController.deleteFromArchive))
    router.post('/chat/:id/pin', wrap(chatController.pin))
    router.delete('/chat/:id/pin', wrap(chatController.unpin))
    router.get('/chat/:id/messages', wrap(messageController.getChatMessages))
    router.post('/message', wrap(messageController.send))
    router.delete('/chat/:chatId/messages/:messageId', wrap(chatController.deleteMessage))
    router.get('/chat/:chatId/messages/last', wrap(chatController.getLastMessage))
    router.patch('/chat/:chatId/messages/:messageId/read', wrap(chatController.markAsReadMessage))

    // session
    router.post('/updateFcmToken', wrap(sessionController.updateFcmToken))
    router.get('/sessions', wrap(sessionController.getSessions))
    router.get('/sessionCount', wrap(sessionController.getDeviceCount))
    router.delete('/session/:id', wrap(sessionController.terminate))
    router.delete('/terminateAllSessions', wrap(sessionController.terminateAll))

    // folder
    router.post('/folder', wrap(folderController.save))
    router.get('/folders', wrap(folderController.getFolders))
    router.delete('/folder/:id', wrap(folderController.delete))
    router.get('/folder/:id/chats', wrap(folderController.getChats))
    router.post('/folders/:folderId/chats/:chatId/pin', wrap(folderController.pinChat))
    router.delete('/folders/:folderId/chats/:chatId/pin', wrap(folderController.unpinChat))

    // channel
    router.post('/channel', wrap(channelController.createChannel))
    router.delete('/channel/:id', wrap(channelController.removeChannel))

    // group
    // router.post('/createGroup', authenticate, groupController.createGroupHandler)

    return router
}

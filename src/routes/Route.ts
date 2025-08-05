import { Request, Response, Router } from 'express'
import { Authenticate } from '../middlewares/Authentificate.js'
import { UserController } from "../controllers/UserController.js"
import { MessageController } from '../controllers/MessageController.js'
import { SessionController } from '../controllers/SessionController.js'
import { ChatController } from '../controllers/ChatController.js'
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest.js'
import { FolderController } from '../controllers/FolderController.js'

type AuthenticateHandler = (req: AuthenticatedRequest, res: Response) => void

function wrap(handler: AuthenticateHandler) {
    return (req: Request, res: Response) => {
        handler(req as AuthenticatedRequest, res)
    }
}

export const createMainRouter = (): Router => {
    const userController = new UserController()
    const messageController = new MessageController()
    const sessionController = new SessionController()
    const chatController = new ChatController()
    const folderController = new FolderController()

    const authenticate = new Authenticate().authenticate

    const router = Router()

    // user
    router.post('/login', userController.login)
    router.post('/register', userController.register)
    router.post('/findUserByLogin', userController.findUserByLogin)
    router.get('/searchUser', authenticate, wrap(userController.searchUsers))
    router.get('/me', authenticate, wrap(userController.getMe))
    router.get('/user/:id', authenticate, wrap(userController.getUserById))
    router.put('/profileUpdate', authenticate, wrap(userController.profileUpdate))

    // chat
    router.get('/chats', authenticate, wrap(chatController.getAllChats))
    router.get('/archivedChat', authenticate, wrap(chatController.getArchivedChats))
    router.get('/unarchivedChat', authenticate, wrap(chatController.getUnarchivedChats))
    router.post('/addChatToArchive', authenticate, wrap(chatController.addChatToArchive))
    router.post('/deleteChatFromArchive', authenticate, wrap(chatController.deleteChatFromArchive))
    router.post('/pinChat', authenticate, wrap(chatController.pinChat))
    router.post('/unpinChat', authenticate, wrap(chatController.unpinChat))

    // session
    router.post('/updateFcmToken', authenticate, wrap(sessionController.updateFcmToken))
    router.post('/terminateAllSessions', authenticate, wrap(sessionController.terminateAllSessions))
    router.get('/sessions', authenticate, wrap(sessionController.getSessions))
    router.get('/sessionCOunt', authenticate, wrap(sessionController.getDeviceCount))
    router.delete('/session/:id', authenticate, wrap(sessionController.terminateSession))

    // folder
    router.get("/folders", authenticate, wrap(folderController.getFolders))
    router.get("/folder/:id/chats", authenticate, wrap(folderController.getFolderChats))
    router.post("/folder", authenticate, wrap(folderController.saveFolder))
    router.delete("/folder/:id", authenticate, wrap(folderController.deleteFolder))

    // channel
    // router.post('/createChannel', authenticate, channelController.createChannelHandler)

    // group
    // router.post('/createGroup', authenticate, groupController.createGroupHandler)

    // message
    router.post('/message', authenticate, wrap(messageController.sendMessage))
    router.get('/messages', authenticate, wrap(messageController.getChatMessages))
    router.post('/deleteChat', authenticate, wrap(messageController.deleteChatMessages))

    return router
}

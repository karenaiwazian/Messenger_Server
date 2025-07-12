import { Router } from 'express'
import { authenticate } from '../middlewares/authMiddleware.js'
import * as userController from '../controllers/userController.js'
import * as messageController from '../controllers/messageController.js'
import * as sessionController from '../controllers/sessionController.js'
import * as channelController from '../controllers/channelController.js'

const router = Router()

// user
router.post('/login', userController.login)
router.post('/register', userController.register)
router.post('/logout', authenticate, userController.logout)
router.post('/findUserByLogin', userController.findUserByLogin)
router.post('/checkVerificationCode', userController.checkVerificationCode)
router.get('/searchUser', authenticate, userController.searchUser)
router.get('/profile', authenticate, userController.profile)
router.get('/users/:id', authenticate, userController.getUserById)
router.put('/profileUpdate', authenticate, userController.profileUpdate)

// sessions
router.post('/updateFcmToken', authenticate, sessionController.updateFcmTokenHandler)
router.post('/terminateAllSessions', authenticate, sessionController.terminateAllSessionsHandler)
router.get('/getSessions', authenticate, sessionController.getSessionsHandler)
router.get('/getDeviceCount', authenticate, sessionController.getDeviceCountHandler)

// channels
router.post('/createChannel', authenticate, channelController.createChannelHandler)
router.post('/createGroup', authenticate, channelController.createGroupHandler)

// messages
router.get('/messages', authenticate, messageController.messages)
router.post('/deleteChat', authenticate, messageController.deleteChatHandler)
router.get('/contacts', authenticate, messageController.contacts)

export default router

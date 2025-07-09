import { Router } from 'express'
import { authenticate } from './authMiddleware.js'
import * as route from './routeHandlers.js'

const router = Router()

router.post('/login', route.login)

router.post('/register', route.register)

router.post('/findUserByLogin', route.findUserByLogin)

router.post('/checkVerificationCode', route.checkVerificationCode)

router.post('/deleteChat', authenticate, route.deleteChat)

router.post('/updateFcmToken', authenticate, route.updateFcmToken)

router.post('/logout', authenticate, route.logout)

router.post('/terminateAllSessions', authenticate, route.terinameAllSession)

router.get('/messages', authenticate, route.messages)

router.get('/searchUser', authenticate, route.searchUser)

router.get('/profile', authenticate, route.profile)

router.put('/profileUpdate', authenticate, route.profileUpdate)

router.get('/contacts', authenticate, route.contacts)

router.get('/users/:id', authenticate, route.getUserById)

router.get('/getSessions', authenticate, route.getSessions)

router.get('/getDeviceCount', authenticate, route.getDeviceCount)

export default router

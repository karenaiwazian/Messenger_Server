import { Router } from "express"
import { User as UserController } from "../controllers/User.js"

export const createAuthRouter = (): Router => {
    const userController = new UserController()

    const router = Router()

    router.post('/login', userController.login)
    router.post('/register', userController.register)
    router.get('/findUserByLogin/:login', userController.findUserByLogin)

    return router
}

import "express"
import "reflect-metadata"
import express from 'express'
import { createApiRouter } from './routes/ApiRoute.js'
import { WebSocketController } from "./controllers/WebSocketController.js"
import { APP_NAME, SERVER_PORT } from "./Constants.js"
import { prisma } from "./Prisma.js"
import { Authenticate } from "./middlewares/Authentificate.js"
import { createAuthRouter } from "./routes/AuthRoute.js"

const app = express()

app.use(express.json())

const apiRouter = createApiRouter()
const authRouter = createAuthRouter()

const authenticate = new Authenticate().authenticate

app.use('/api/', authenticate, apiRouter)
app.use('/auth/', authRouter)

app.listen(SERVER_PORT, async () => {
    new WebSocketController()

    await createSystemUser()

    console.log(`Сервер запущен на http://localhost:${SERVER_PORT}`)
})

async function createSystemUser() {
    await prisma.user.upsert({
        where: { id: 0 },
        update: {},
        create: {
            id: 0,
            firstName: APP_NAME,
            login: "",
            password: ""
        }
    })
}
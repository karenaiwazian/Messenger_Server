import "express"
import "reflect-metadata"
import express from 'express'
import { createApiRouter } from './routes/Route.js'
import { WebSocketController } from "./controllers/WebSocketController.js"
import { APP_NAME, SERVER_PORT } from "./Constants.js"
import { prisma } from "./Prisma.js"

const app = express()
app.use(express.json())

const mainRouter = createApiRouter()
app.use('/', mainRouter)

app.listen(SERVER_PORT, async () => {
    new WebSocketController()

    console.log(`Сервер запущен на http://localhost:${SERVER_PORT}`)

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
})
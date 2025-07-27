import "express"
import "reflect-metadata"
import express from 'express'
import { SERVER_PORT } from './constants.js'
import { createMainRouter } from './routes/Route.js'
import { WebSocketController } from "./WebSocket.js"

const app = express()
app.use(express.json())

const mainRouter = createMainRouter()
app.use('/', mainRouter)

app.listen(SERVER_PORT, () => {
    console.log(`Сервер запущен на http://localhost:${SERVER_PORT}`)
})

new WebSocketController()

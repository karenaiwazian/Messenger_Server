import dotenv from 'dotenv'

dotenv.config()

export const SERVER_PORT = process.env.SERVER_PORT
export const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY
export const APP_NAME = process.env.APP_NAME
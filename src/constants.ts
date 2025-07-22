import { createRequire } from 'module'

const requireJSON = createRequire(import.meta.url)
const constants = requireJSON('./config/constants.json')

export const SERVER_PORT = constants.server_port
export const WEBSOCKET_PORT = constants.websocket_port
export const JWT_SECRET = constants.secret_key
export const APP_NAME = constants.app_name

import jwt from 'jsonwebtoken'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const constants = require('./constants.json')

const JWT_SECRET = constants.secret_key

export function authenticate(req, res, next) {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'token not found' })

    try {
        const payload = jwt.verify(token, JWT_SECRET)
        req.userId = payload.id
        req.token = token
        next()
    } catch {
        console.log('token is invalid')
        res.status(403).json({ error: 'token is invalid' })
    }
}

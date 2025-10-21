import { Request } from "express"
import { EntityId } from "../types/EntityId.js"

export interface AuthenticatedRequest extends Request {
    user: {
        id: EntityId
        token: string
    }
}
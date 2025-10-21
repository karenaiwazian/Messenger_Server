import WebSocket from "ws"
import { EntityId } from "../types/EntityId"

export interface MyWebSocket extends WebSocket {
    userId: EntityId
    token: string
}

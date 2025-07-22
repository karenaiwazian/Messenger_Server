import WebSocket from "ws"

export interface MyWebSocket extends WebSocket {
    userId: number
    token: string
}

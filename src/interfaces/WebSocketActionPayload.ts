import { WebSocketAction } from './WebSocketAction.js'
import { Message } from './Message.js'
import { DeleteChatPayload } from './DeleteChatPayload.js'
import { DeleteMessagePayload } from './DeleteMessagePayload.js'

export type WebSocketActionPayload = {
    [WebSocketAction.NEW_MESSAGE]: Message
    [WebSocketAction.DELETE_CHAT]: DeleteChatPayload
    [WebSocketAction.DELETE_MESSAGE]: DeleteMessagePayload
}

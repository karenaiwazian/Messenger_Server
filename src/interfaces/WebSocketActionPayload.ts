import { WebSocketAction } from './WebSocketAction.js'
import { Message } from './Message.js'
import { DeleteChatPayload } from './DeleteChatPayload.js'
import { DeleteMessagePayload } from './DeleteMessagePayload.js'
import { ReadMessagePayload } from './ReadMessagePayload.js'

export type WebSocketActionPayload = {
    [WebSocketAction.NEW_MESSAGE]: Message
    [WebSocketAction.DELETE_CHAT]: DeleteChatPayload
    [WebSocketAction.DELETE_MESSAGE]: DeleteMessagePayload
    [WebSocketAction.READ_MESSAGE]: ReadMessagePayload
}

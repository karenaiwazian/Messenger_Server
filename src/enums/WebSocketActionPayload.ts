import { WebSocketAction } from '../enums/WebSocketAction.js'
import { Message } from '../interfaces/Message.js'
import { DeleteMessagePayload } from '../interfaces/DeleteMessagePayload.js'
import { ReadMessagePayload } from '../interfaces/ReadMessagePayload.js'
import { ChatInfo } from '../interfaces/ChatInfo.js'
import { DeleteChatPayload } from '../interfaces/DeleteChatPayload.js'

export type WebSocketActionPayload = {
    [WebSocketAction.NEW_MESSAGE]: Message
    [WebSocketAction.DELETE_CHAT]: DeleteChatPayload
    [WebSocketAction.DELETE_MESSAGE]: DeleteMessagePayload
    [WebSocketAction.READ_MESSAGE]: ReadMessagePayload
    [WebSocketAction.NEW_CHAT]: ChatInfo
}

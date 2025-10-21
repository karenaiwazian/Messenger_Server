import { ChatType } from "../enums/ChatType.js"
import { EntityId } from "../types/EntityId.js"

export class IdGenerator {

    static prefixes = {
        user: 1,
        channel: 2,
        group: 3
    }

    static generateUserId(): EntityId {
        return this.generateUniqueId(this.prefixes.user)
    }

    static generateChannelId(): EntityId {
        return this.generateUniqueId(this.prefixes.channel)
    }

    static generateGroupId(): EntityId {
        return this.generateUniqueId(this.prefixes.group)
    }

    static detectType(id: EntityId): ChatType {
        const idString = id.toString()
        const firstDigit = Number(idString[0])

        switch (firstDigit) {
            case 1: return ChatType.PRIVATE
            case 2: return ChatType.CHANNEL
            case 3: return ChatType.GROUP
            default: return ChatType.UNKNOWN
        }
    }

    private static generateUniqueId(prefix: number): EntityId {
        const timestamp = Date.now().toString().slice(-6)

        const randomNumber = Math.floor(Math.random() * 100)

        return EntityId(`${prefix}${timestamp}${randomNumber}`)
    }
}
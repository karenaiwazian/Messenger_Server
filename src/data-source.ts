import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User.js"
import { Message } from "./entity/Message.js"
import { Session } from "./entity/Session.js"
import { ArchiveChat } from "./entity/ArchiveChat.js"
import { ChatFolder } from "./entity/ChatFolder.js"
import { ChatFolderChats } from "./entity/ChatFolderChats.js"
import { Channel } from "./entity/Channel.js"
import { Group } from "./entity/Group.js"

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "database.sqlite",
    synchronize: true,
    logging: ["query", "error"],
    entities: [User, Message, Session, ChatFolder, ChatFolderChats, ArchiveChat, Channel, Group],
    migrations: [],
    subscribers: [],
})

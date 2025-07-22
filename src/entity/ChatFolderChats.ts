import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class ChatFolderChats {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    chatId!: number

    @Column()
    chatFolderId!: number

    @Column({ default: false })
    isPinned?: boolean = false
}

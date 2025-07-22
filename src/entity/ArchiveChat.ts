import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class ArchiveChat {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    userId!: number

    @Column()
    chatId!: number

    @Column({ default: false })
    isPinned: boolean = false
}

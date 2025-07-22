import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    senderId!: number

    @Column()
    receiverId!: number

    @Column({ default: "" })
    text?: string

    @Column({ type: "bigint", default: () => Date.now() })
    timestamp!: number

    @Column({ default: false })
    deleted_by_sender!: boolean

    @Column({ default: false })
    deleted_by_receiver!: boolean
}

import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class Channel {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    ownerUserId!: number

    @Column()
    channelName!: string

    @Column()
    bio?: string

    @Column({ unique: true })
    username?: string
}

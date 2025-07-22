import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class Group {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    ownerUserId!: number

    @Column()
    channelName!: string

    @Column()
    bio?: string
}

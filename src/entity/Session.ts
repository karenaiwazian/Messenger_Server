import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class Session {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    userId!: number

    @Column()
    token!: string

    @Column({ default: "" })
    fcmToken?: string

    @Column()
    deviceName!: string

    @Column({ default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date
}

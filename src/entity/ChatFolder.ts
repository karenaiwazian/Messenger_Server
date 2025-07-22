import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class ChatFolder {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    userId!: number

    @Column()
    folderName!: string
}

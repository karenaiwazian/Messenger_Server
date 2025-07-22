import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ default: "" })
    firstName?: string;

    @Column({ default: "" })
    lastName?: string;

    @Column({ default: "" })
    bio?: string

    @Column({ unique: true, nullable: true, default: null })
    username?: string

    @Column({ unique: true, nullable: true })
    login!: string

    @Column()
    password?: string
}

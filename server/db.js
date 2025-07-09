import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

let db

export async function getInstance() {
    if (db) {
        return db
    }

    db = await open({
        filename: './database.db',
        driver: sqlite3.Database
    })

    await createUsersTable()
    await createGroupsTable()
    await createMessagesTable()
    await createSessionTokensTable()

    return db
}

async function createUsersTable() {
    await db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                login TEXT UNIQUE,
                password TEXT,
                username TEXT UNIQUE,
                firstName TEXT DEFAULT '',
                lastName TEXT DEFAULT '',
                bio TEXT DEFAULT ''
            )
        `)
}

async function createGroupsTable() {
    await db.run(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                senderId TEXT,
                receiverId TEXT,
                text TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                deleted_by_sender BOOLEAN DEFAULT 0,
                deleted_by_receiver BOOLEAN DEFAULT 0
            )
        `)
}

async function createMessagesTable() {
    await db.run(`
            CREATE TABLE IF NOT EXISTS tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                token TEXT UNIQUE,
                deviceName TEXT,
                fcmToken TEXT,  
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )
        `)
}

async function createSessionTokensTable() {
    await db.run(`
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                groupName INTEGER,
                ownerId TEXT UNIQUE,
                FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE
            )
        `)
}
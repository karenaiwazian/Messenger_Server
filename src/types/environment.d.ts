declare namespace NodeJS {
    interface ProcessEnv {
        DATABASE_URL: string
        APP_NAME: string
        JWT_SECRET_KEY: string
        SERVER_PORT: number
        WEBSOCKET_PORT: number
    }
}
export type SessionInfo = {
    id: number
    userId: number
    token: string
    fcmToken: string | null
    deviceName: string
    createdAt: Date
}

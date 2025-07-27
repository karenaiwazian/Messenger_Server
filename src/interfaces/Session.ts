export type SessionInfo = {
    id: number
    userId: number
    token: string
    fcmToken?: string
    deviceName: string
    createdAt: Date
}

import admin from 'firebase-admin'
import { SessionService } from "./SessionService.js"
import { Notification } from '../interfaces/Notification.js'

export class NotificationService {

    private sessionService = new SessionService()

    sendPushNotification = async (userId: number, token: string, chatId: number, notification: Notification) => {
        try {
            const sessions = await this.sessionService.getSessions(userId, token)
            const tokens = sessions.map(session => session.fcmToken).filter(token => token !== undefined)

            if (tokens.length === 0) {
                console.log('Нет токенов для отправки.')
                return
            }

            const message = {
                tokens: tokens,
                data: {
                    title: notification.title,
                    body: notification.body,
                    chatId: String(chatId),
                }
            }

            const response = await admin.messaging().sendEachForMulticast(message)

            console.log(`Push-уведомления отправлены:`, response)
        } catch (error) {
            console.error('Ошибка отправки уведомлений:', error)
        }
    }
}
import admin from 'firebase-admin'
import { SessionService } from "./SessionService.js"
import { Notification } from '../interfaces/Notification.js'

export class NotificationService {

    private sessionService = new SessionService()

    sendPushNotification = async (userId: number, token: string, chatId: number, notification: Notification) => {
        try {
            var sessions

            if (userId == chatId) {
                sessions = await this.sessionService.getSessions(userId, token)
            } else {
                sessions = await this.sessionService.getUserSessions(chatId)
            }

            const tokens = sessions.map(session => session.fcmToken).filter(token => token !== null)

            if (tokens.length === 0) {
                return
            }

            const message = {
                tokens: tokens,
                data: {
                    title: notification.title,
                    body: notification.body,
                    chatId: userId.toString(),
                }
            }

            const response = await admin.messaging().sendEachForMulticast(message)

            console.log('Push-уведомления отправлены:', response)
        } catch (error) {
            console.error('Ошибка отправки уведомлений:', error)
        }
    }
}
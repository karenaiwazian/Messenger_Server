import admin from 'firebase-admin'
import { Session as SessionService } from "./Session.js"
import { Notification as NotificationPayload } from '../interfaces/Notification.js'

export class Notification {

    private sessionService = new SessionService()

    sendPush = async (userId: number, token: string, chatId: number, notification: NotificationPayload) => {
        try {
            var sessions

            if (userId == chatId) {
                sessions = await this.sessionService.getSessions(userId, token)
            } else {
                sessions = await this.sessionService.getUserSessions(chatId)
            }

            const tokens = sessions.map(session => session.fcmToken).filter(token => token !== undefined)

            if (tokens.length === 0) {
                console.error('Нет токенов для отправки уведомлений')
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
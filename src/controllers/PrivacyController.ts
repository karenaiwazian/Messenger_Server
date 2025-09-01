import { Response } from "express"
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest.js"
import { PrivacyService } from "../services/PrivacyService.js"
import { ApiReponse } from "../interfaces/ApiResponse.js"

export class PrivacyController {

    private privacyService = new PrivacyService()

    getMyPrivacy = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id

            const privacy = await this.privacyService.getUserPrivacy(userId)

            if (privacy == null) {
                return res.status(404).json(ApiReponse.Error("Нет настроек конфиденциальности для пользователя"))
            }

            res.status(200).json(privacy)
        } catch (error) {
            console.error("Ошибка при получении настроек конфиденциальности пользователя", error)
            res.status(400).json(ApiReponse.Error("Ошибка при получении настроек конфиденциальности пользователя"))
        }
    }

    setBio = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const value = parseInt(req.params.value)

            await this.privacyService.setBio(userId, value)

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            console.error("Ошибка", error)
            res.status(400).json(ApiReponse.Error("Ошибка"))
        }
    }

    setDateOfBirth = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user.id
            const value = parseInt(req.params.value)

            await this.privacyService.setDateOfBirth(userId, value)

            res.status(200).json(ApiReponse.Success())
        } catch (error) {
            console.error("Ошибка", error)
            res.status(400).json(ApiReponse.Error("Ошибка"))
        }
    }
}
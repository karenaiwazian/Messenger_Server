import { prisma } from "../Prisma.js"
import { PrivacyLevel } from "../interfaces/PrivacyLevel.js"
import { PrivacySettings } from "../interfaces/PrivacySettings.js"
import { EntityId } from "../types/EntityId.js"

export class PrivacyService {

    initUserPrivacy = async (userId: EntityId) => {
        const defaultValue = PrivacyLevel.Everybody

        await prisma.privacySettings.create({
            data: {
                userId: userId,
                lastSeen: defaultValue,
                messages: defaultValue,
                bio: defaultValue,
                dateOfBirth: defaultValue,
                invites: defaultValue
            }
        })
    }

    getUserPrivacy = async (userId: EntityId): Promise<PrivacySettings | null> => {
        const userPrivacy = await prisma.privacySettings.findFirst({
            where: {
                userId: userId
            }
        })

        if (userPrivacy == null) {
            return null
        }

        return userPrivacy as PrivacySettings
    }

    setBio = async (userId: EntityId, level: PrivacyLevel) => {
        await prisma.privacySettings.update({
            where: {
                userId: userId
            },
            data: {
                bio: level
            }
        })
    }

    setDateOfBirth = async (userId: EntityId, level: PrivacyLevel) => {
        await prisma.privacySettings.update({
            where: {
                userId: userId
            },
            data: {
                dateOfBirth: level
            }
        })
    }
}
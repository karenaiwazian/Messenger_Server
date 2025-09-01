import { prisma } from "../Prisma.js"
import { PrivacyLevel } from "../interfaces/PrivacyLevel.js"
import { PrivacySettings } from "../interfaces/PrivacySettings.js"

export class PrivacyService {

    initUserPrivacy = async (userId: number) => {
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

    getUserPrivacy = async (userId: number): Promise<PrivacySettings | null> => {
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

    setBio = async (userId: number, level: PrivacyLevel) => {
        await prisma.privacySettings.update({
            where: {
                userId: userId
            },
            data: {
                bio: level
            }
        })
    }

    setDateOfBirth = async (userId: number, level: PrivacyLevel) => {
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
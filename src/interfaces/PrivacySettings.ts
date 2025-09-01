import { PrivacyLevel } from "./PrivacyLevel"

export type PrivacySettings = {
    bio: PrivacyLevel
    dateOfBirth: PrivacyLevel
    lastSeen: PrivacyLevel
    messages: PrivacyLevel
    invites: PrivacyLevel
}
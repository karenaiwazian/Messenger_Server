import { GroupInfo } from "../interfaces/GroupInfo.js"
import { prisma } from "../Prisma.js"
import { EntityId } from "../types/EntityId.js"

export class GroupService {

    create = async (groupInfo: GroupInfo): Promise<EntityId> => {
        const createdGroup = await prisma.group.create({
            data: {
                id: groupInfo.id,
                ownerId: groupInfo.ownerId,
                name: groupInfo.name,
                bio: groupInfo.bio
            },
            select: {
                id: true
            }
        })

        return createdGroup.id
    }

    delete = async (userId: EntityId, groupId: EntityId) => {
        await prisma.group.delete({
            where: {
                id: groupId,
                ownerId: userId
            }
        })
    }

    getById = async (id: EntityId): Promise<GroupInfo | null> => {
        const group = await prisma.group.findFirst({
            where: {
                id: id
            }
        })

        return group as GroupInfo
    }

    join = async (userId: EntityId, groupId: EntityId) => {
        await prisma.groupMember.upsert({
            create: {
                userId: userId,
                groupId: groupId
            },
            update: {
                userId: userId,
                groupId: groupId
            },
            where: {
                groupId_userId: {
                    userId: userId,
                    groupId: groupId
                }
            }
        })
    }

    leave = async (userId: EntityId, groupId: EntityId) => {
        await prisma.groupMember.delete({
            where: {
                groupId_userId: {
                    groupId: groupId,
                    userId: userId
                }
            }
        })
    }

    getMembers = async (groupId: EntityId): Promise<number[]> => {
        const members = await prisma.groupMember.findMany({
            where: {
                groupId: groupId
            },
            select: {
                userId: true
            }
        })

        return members.map(member => member.userId)
    }
}

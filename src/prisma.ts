import { PrismaClient } from "@prisma/client"

const globalPrisma = globalThis as unknown as {
    prosma: PrismaClient | undefined
}

export const prisma = globalPrisma.prosma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
    globalPrisma.prosma = prisma
}

import "express"

declare module "express" {
    interface Request {
        user?: {
            id: string
            token: string
        }
    }
}

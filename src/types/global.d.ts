import "express"

declare module "express" {
    interface Request {
        user?: {
            id: EntityId = 0
            token: string = ""
        }
    }
}

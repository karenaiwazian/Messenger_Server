import "express"

declare module "express" {
    interface Request {
        user?: {
            id: number = 0
            token: string = ""
        }
    }
}

import { EntityId } from "../types/EntityId"

export class ApiReponse {
    static Success(msg: string | EntityId = ""): ApiResult {
        return {
            status: true,
            message: msg.toString()
        }
    }

    static Error(msg: string): ApiResult {
        return {
            status: false,
            message: msg
        }
    }
}

type ApiResult = {
    status: boolean
    message: string
}
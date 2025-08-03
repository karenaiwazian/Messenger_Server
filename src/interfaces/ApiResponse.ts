export class ApiReponse {
    static Success(msg: string = ""): ApiResult {
        return {
            status: true,
            message: msg
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
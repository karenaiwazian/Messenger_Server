import bcrypt from 'bcrypt'

export class CryptoService {

    hashPassword = async (password: string): Promise<string> => {
        return await bcrypt.hash(password, 10)
    }

    comparePassword = async (password: string, hashed: string): Promise<boolean> => {
        return await bcrypt.compare(password, hashed)
    }
}
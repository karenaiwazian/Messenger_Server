import { Repository } from "typeorm"
import { Channel } from "../entity/Channel"

export class ChannelService {
    private channelRepository: Repository<Channel>

    constructor(channelRepository: Repository<Channel>) {
        this.channelRepository = channelRepository
    }
}

import { Repository } from "typeorm"
import { Group } from "../entity/Group"

export class GroupService {
    private groupRepository: Repository<Group>

    constructor(groupRepository: Repository<Group>) {
        this.groupRepository = groupRepository
    }
}

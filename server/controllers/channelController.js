import { createChannel, createGroup } from '../services/channelService.js'

export async function createChannelHandler(req, res) {
    const { channelName, channelBio } = req.body

    if (!channelName) {
        res.json({})
        return
    }

    await createChannel(channelName, channelBio)

    res.json({ success: true })
}

export async function createGroupHandler(req, res) {
    const { groupName, groupBio } = req.body

    if (!groupName) {
        res.json({})
        return
    }

    await createGroup(groupName, groupBio)

    res.json({ success: true })
}

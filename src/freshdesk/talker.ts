/* eslint-disable sort-keys */
/* eslint-disable camelcase */
import {
  Message,
  log,
}             from 'wechaty'
import stream from 'stream'

import * as api from './api'

function freshdeskTalker (
  portalUrl: string,
  apiKey: string,
) {
  log.verbose('WechatyPluginFreshdesk', 'freshdeskTalker(%s, %s)', portalUrl, apiKey)

  const rest = api.getUnirest(portalUrl, apiKey)

  const getContact    = api.contactGetter(rest)
  const createContact = api.contactCreator(rest)
  const getTicket     = api.ticketGetter(rest)
  const createTicket  = api.ticketCreator(rest)
  const replyTicket   = api.ticketReplier(rest)

  return async function talkFreshdesk (
    message: Message,
  ): Promise<void> {
    log.verbose('WechatyPluginFreshdesk', 'talkFreshdesk(%s)', message)

    const talker = message.from()!

    const externalId = talker.id
    const name       = talker.name()

    const room = message.room()
    const text = await message.mentionText()

    const attachments: stream.Readable[] = []

    switch (message.type()) {
      case Message.Type.Text:
        break

      case Message.Type.Image:
      case Message.Type.Audio:
      case Message.Type.Video:
      case Message.Type.Attachment:
        const duplex = new stream.Duplex()
        attachments.push(duplex)

        const filebox = await message.toFileBox()
        filebox.pipe(duplex)
        break

      default:
        log.verbose('WechatyPluginFreshdesk', 'talkFreshdesk() message type skipped: %s', Message.Type[message.type()])
        return
    }

    /**
     * Create contact if not exist yet
     */
    let userId = await getContact(externalId)
    if (!userId) {
      const newUserId = await createContact({
        externalId,
        name,
      })
      userId = newUserId
    }

    /**
     * Create conversation if not exist yet
     */
    const ticketList = await getTicket(userId)
    if (ticketList.length > 0) {

      // FIXME(huan) Make sure the newest ticket is index 0
      const ticketId = ticketList[0]

      await replyTicket({
        attachments,
        ticketId,
        userId,
        body: text,
      })

    } else {

      let subject = room
        ? (' from ' + await room.topic())
        : ''
      subject = name + subject

      await createTicket({
        attachments,
        requesterId: userId,
        subject,
        description: text,
      })

    }

  }

}

export { freshdeskTalker }

/* eslint-disable sort-keys */
/* eslint-disable camelcase */
import {
  Message,
  log,
}                           from 'wechaty'

import * as api from './api'

function freshdeskTalker (
  portalUrl: string,
  apiKey: string,
) {
  log.verbose('WechatyPluginFreshdesk', 'freshdeskTalker(%s, %s)', portalUrl, apiKey)

  const client = api.getClient(portalUrl, apiKey)

  const getContact    = api.contactGetter(client)
  const createContact = api.contactCreator(client)
  const getTicket     = api.ticketGetter(client)
  const createTicket  = api.ticketCreator(client)
  const replyTicket   = api.ticketReplier(client)

  return async function talkFreshdesk (
    message: Message,
  ): Promise<void> {
    log.verbose('WechatyPluginFreshdesk', 'talkFreshdesk(%s)', message)

    const talker = message.from()!

    const externalId = talker.id
    const name       = talker.name()

    const room = message.room()
    const text = await message.mentionText()

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
        requesterId: userId,
        subject,
        description: text,
      })

    }

  }

}

export { freshdeskTalker }

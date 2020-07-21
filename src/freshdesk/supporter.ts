/* eslint-disable sort-keys */
/* eslint-disable camelcase */
import {
  Message,
  log,
}               from 'wechaty'
import {
  FileBox,
}               from 'file-box'

import * as api from './api'

function freshdeskSupporter (
  portalUrl: string,
  apiKey: string,
) {
  log.verbose('WechatyPluginFreshdesk', 'freshdeskSupporter(%s, %s)', portalUrl, apiKey)

  const rest = api.getSimpleUnirest(portalUrl, apiKey)

  const getContact    = api.contactGetter(rest)
  const createContact = api.contactCreator(rest)
  const getTicket     = api.ticketGetter(rest)
  const createTicket  = api.ticketCreator(rest)
  const replyTicket   = api.ticketReplier(rest)

  return async function supportFreshdesk (
    message: Message,
  ): Promise<void> {
    log.verbose('WechatyPluginFreshdesk', 'supportFreshdesk(%s)', message)

    const talker = message.from()!

    const externalId = talker.id
    const name       = talker.name()

    const room = message.room()

    let text: string

    const attachmentList: FileBox[] = []

    switch (message.type()) {
      case Message.Type.Text:
        text = await message.mentionText()
        break

      case Message.Type.Image:
      case Message.Type.Audio:
      case Message.Type.Video:
      case Message.Type.Attachment:
        {
          const filebox = await message.toFileBox()
          text = filebox.name

          log.verbose('WechatyPluginFreshdesk', 'supportFreshdesk() filebox name: %s', filebox.name)

          attachmentList.push(filebox)
        }
        break

      default:
        log.verbose('WechatyPluginFreshdesk', 'supportFreshdesk() message type skipped: %s',
          Message.Type[message.type()],
        )
        return
    }

    if (!text) {
      text = 'NO TEXT'
    }

    /**
     * Create contact if not exist yet
     */
    let userId = await getContact(externalId)
    if (!userId) {
      log.verbose('WechatyPluginFreshdesk',
        'supportFreshdesk() create freshdesk contact from wechaty contact id: %s',
        externalId,
      )

      const newUserId = await createContact({
        externalId,
        name,
      })
      userId = newUserId
    }

    /**
     * Create ticket if not exist yet
     */
    const getRoomTicket = async (userId: number, roomId?: string): Promise<number[]> => {
      let filterRoom
      if (room) {
        filterRoom = (payload: api.CustomFieldsPayload) => payload.custom_fields?.cf_roomid === roomId
      } else {
        filterRoom = (payload: api.CustomFieldsPayload) => !(payload.custom_fields?.cf_roomid)
      }

      const idList = (await getTicket(userId))
        .filter(filterRoom)
        .map(p => p.id)
      return idList
    }

    const ticketIdList = await getRoomTicket(userId, room?.id)
    if (ticketIdList.length > 0) {
      // FIXME(huan) Make sure the newest ticket is index 0
      const ticketId = ticketIdList[0]

      log.verbose('WechatyPluginFreshdesk',
        'supportFreshdesk() reply existing ticket #%s',
        ticketId,
      )

      await replyTicket({
        attachments: attachmentList,
        ticketId,
        userId,
        body: text,
      })

    } else {

      let subject = room
        ? (' from ' + await room.topic())
        : ''
      subject = name + subject

      const ticketId = await createTicket({
        attachments: attachmentList,
        requesterId: userId,
        subject,
        description: text,
        custom_fields: {
          cf_roomid: room?.id,
        },
      })

      log.verbose('WechatyPluginFreshdesk',
        'supportFreshdesk() created new ticket #%s',
        ticketId,
      )

    }

  }

}

export { freshdeskSupporter }

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
  portalUrl : string,
  apiKey    : string,
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
    const talker = message.talker()

    let freshdeskContactPayload = await getContact(talker.id)
    if (!freshdeskContactPayload) {
      log.verbose('WechatyPluginFreshdesk',
        'supportFreshdesk() create freshdesk contact from wechaty contact id: %s',
        talker.id,
      )

      const payload = await createContact({
        twitterId : talker.id,
        name      : talker.name(),
      })
      if (!payload) {
        const err = 'supportFreshdesk() createContact() failed for talker.id:' + talker.id
        log.error('WechatyPluginFreshdesk', err)
        throw new Error(err)
      }
      freshdeskContactPayload = payload
    }

    /**
     * Create ticket if not exist yet
     */
    const room = message.room()

    const getRoomTicket = async (
      freshdeskContactId : number,
      wechatyContactId   : string,
      wechatyRoomId?     : string,
    ): Promise<number[]> => {
      let filterRoom
      if (room) {
        filterRoom = (payload: api.CustomFieldsPayload) => payload.custom_fields?.cf_wechaty_room === wechatyRoomId
      } else {
        filterRoom = (payload: api.CustomFieldsPayload) => !(payload.custom_fields?.cf_wechaty_room)
      }

      const filterContact = (payload: api.CustomFieldsPayload) => payload.custom_fields?.cf_wechaty_contact === wechatyContactId

      const idList = (await getTicket(freshdeskContactId))
        .filter(filterContact)
        .filter(filterRoom)
        .map(p => p.id)
      return idList
    }

    const ticketIdList = await getRoomTicket(freshdeskContactPayload.id, talker.id, room?.id)
    if (ticketIdList.length > 0) {
      // FIXME(huan) Make sure the newest ticket is index 0
      const ticketId = ticketIdList[0]

      log.verbose('WechatyPluginFreshdesk',
        'supportFreshdesk() reply existing ticket #%s',
        ticketId,
      )

      await replyTicket({
        attachments: attachmentList,
        body: text,
        ticketId,
        userId: freshdeskContactPayload.id,
      })

    } else {

      let subject = room
        ? (' from ' + await room.topic())
        : ''
      subject = talker.name() + subject

      const ticketId = await createTicket({
        attachments: attachmentList,
        requesterId: freshdeskContactPayload.id,
        subject,
        description: text,
        custom_fields: {
          cf_wechaty_contact : talker.id,
          cf_wechaty_room    : room?.id,
        },
      })

      log.verbose('WechatyPluginFreshdesk',
        'supportFreshdesk() created new ticket #%s for requesterId: %s%s',
        ticketId,
        freshdeskContactPayload.id,
        room
          ? `in room ${room.id}`
          : '',
      )

    }

  }

}

export { freshdeskSupporter }

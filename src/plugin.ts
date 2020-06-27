import {
  Wechaty,
  WechatyPlugin,
  log,
}                   from 'wechaty'
import {
  matchers,
  talkers,
}                   from 'wechaty-plugin-contrib'

import { freshdeskTalker }  from './freshdesk/mod'
import { smeeWebhook }      from './smee'
import { normalizeConfig }  from './normalize-config'

export interface WechatyFreshdeskConfig {
  room: matchers.RoomMatcherOptions,

  close?             : talkers.RoomTalkerOptions,
  at?                : boolean,
  webhookProxyUrl?   : string,
  portalUrl? : string,
  apiKey?    : string,
}

function WechatyFreshdesk (config: WechatyFreshdeskConfig): WechatyPlugin {
  log.verbose('WechatyFreshdesk', 'WechatyFreshdesk(%s)', JSON.stringify(config))

  const {
    portalUrl,
    apiKey,
    webhookProxyUrl,
  }                   = normalizeConfig(config)

  const talkRoomForConversationClosed = talkers.roomTalker(config.close)
  const talkFreshdeskCustomerQuestion  = freshdeskTalker(portalUrl, apiKey)
  const webhook = smeeWebhook(webhookProxyUrl)

  const matchRoom    = matchers.roomMatcher(config.room)

  /**
   * Connect with Wechaty
   */
  return function WechatyFreshdeskPlugin (wechaty: Wechaty) {
    log.verbose('WechatyFreshdesk', 'WechatyFreshdeskPlugin(%s)', wechaty)

    wechaty.on('message', async message => {
      const room = message.room()
      const from = message.from()

      if (!from)                          { return }
      if (!room)                          { return }
      if (message.self())                 { return }
      if (!await matchRoom(room))         { return }
      if (config.at) {
        if (!await message.mentionSelf()) { return }
      }
      if (await message.mentionList()) {
        if (!await message.mentionSelf()) { return }
      }

      await talkFreshdeskCustomerQuestion(message)

    })

    webhook(async (contactId, text) => {
      const contact = wechaty.Contact.load(contactId)
      const roomList = await wechaty.Room.findAll()

      /**
       * TODO(huan): if one contact in two freshdesk room, how to know which room should the bot reply?
       */
      for (const room of roomList) {
        if (!await matchRoom(room))   { continue }
        if (!await room.has(contact)) { continue }

        if (text) {
          await room.say(text, contact)
        } else {  // close event
          await talkRoomForConversationClosed(room, contact)
        }
        break
      }

    })
  }

}

export { WechatyFreshdesk }

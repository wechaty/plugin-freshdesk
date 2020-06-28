import {
  Wechaty,
  WechatyPlugin,
  log,
  Message,
}                   from 'wechaty'
import {
  matchers,
  talkers,
}                   from 'wechaty-plugin-contrib'

import { freshdeskSupporter }  from './freshdesk/mod'
import { smeeWebhook }      from './smee'
import { normalizeConfig }  from './normalize-config'

export interface WechatyFreshdeskConfig {
  contact? : matchers.ContactMatcherOptions,
  room?    : matchers.RoomMatcherOptions,

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
  const supportFreshdesk = freshdeskSupporter(portalUrl, apiKey)
  const webhook = smeeWebhook(webhookProxyUrl)

  const matchContact = typeof config.contact === 'undefined'
    ? () => true
    : matchers.contactMatcher(config.contact)

  const matchRoom = typeof config.room === 'undefined'
    ? () => true
    : matchers.roomMatcher(config.room)

  const isPluginMessage = async (message: Message): Promise<boolean> => {
    const room = message.room()
    const from = message.from()

    if (!from)                          { return false }
    if (!room)                          { return false }
    if (message.self())                 { return false }

    const mentionList = await message.mentionList()
    if (mentionList.length > 0) {
      if (!await message.mentionSelf()) { return false }
    }

    return true
  }

  const isConfigMessage = async (message: Message): Promise<boolean> => {
    const from = message.from()
    const room = message.room()

    if (from && !await matchContact(from))  { return false }

    if (room) {
      if (!await matchRoom(room))           { return false }
      if (config.at) {
        if (!await message.mentionSelf())   { return false }
      }
    }

    return true
  }

  /**
   * Connect with Wechaty
   */
  return function WechatyFreshdeskPlugin (wechaty: Wechaty) {
    log.verbose('WechatyFreshdesk', 'WechatyFreshdeskPlugin(%s)', wechaty)

    wechaty.on('message', async message => {
      log.verbose('WechatyFreshdesk', 'WechatyFreshdeskPlugin() wechaty.on(message) %s', message)

      if (!await isPluginMessage(message)) {
        log.silly('WechatyFreshdesk', 'WechatyFreshdeskPlugin() wechaty.on(message) message not match this plugin, skipped.')
        return
      }

      if (!await isConfigMessage(message)) {
        log.silly('WechatyFreshdesk', 'WechatyFreshdeskPlugin() wechaty.on(message) message not match config, skipped.')
        return
      }

      await supportFreshdesk(message)
    })

    webhook(async (contactId, text) => {
      log.verbose('WechatyFreshdesk', 'WechatyFreshdeskPlugin() webhook(%s, %s)', contactId, text)

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

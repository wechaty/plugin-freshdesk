import {
  Wechaty,
  WechatyPlugin,
  log,
  Message,
}                   from 'wechaty'
import {
  matchers,
  talkers,
  types,
}                   from 'wechaty-plugin-contrib'

import { freshdeskSupporter }  from './freshdesk/mod'
import { smeeWebhook }      from './smee'
import { normalizeConfig }  from './normalize-config'

export interface WechatyFreshdeskConfig {
  contact? : matchers.ContactMatcherOptions,
  room?    : matchers.RoomMatcherOptions,

  close?             : types.TalkerMessage | types.TalkerMessage[],
  mention?           : boolean,
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

  const talkRoomForConversationClosed    = talkers.roomTalker(config.close)
  const talkContactForConversationClosed = talkers.contactTalker(config.close)

  const supportFreshdesk = freshdeskSupporter(portalUrl, apiKey)
  const webhook = smeeWebhook(webhookProxyUrl)

  const matchContact = typeof config.contact === 'undefined'
    ? () => true
    : matchers.contactMatcher(config.contact)

  const matchRoom = typeof config.room === 'undefined'
    ? () => true
    : matchers.roomMatcher(config.room)

  const isPluginMessage = async (message: Message): Promise<boolean> => {
    if (message.self()) { return false }

    const mentionList = await message.mentionList()
    if (mentionList.length > 0) {
      if (!await message.mentionSelf()) { return false }
    }

    return true
  }

  const isConfigMessage = async (message: Message): Promise<boolean> => {
    const from = message.from()
    const room = message.room()

    if (room) {
      if (!await matchRoom(room))             { return false }
      if (config.mention) {
        if (!await message.mentionSelf())     { return false }
      }
    } else {
      if (from && !await matchContact(from))  { return false }
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

    webhook(async (contactId, roomId, text) => {
      log.verbose('WechatyFreshdesk', 'WechatyFreshdeskPlugin() webhook(%s, %s)', contactId, text)

      const contact = wechaty.Contact.load(contactId)

      if (!roomId) {
        if (text) {
          await contact.say(text)
        } else {  // close event
          await talkContactForConversationClosed(contact)
        }

      } else {
        const room = wechaty.Room.load(roomId)

        if (text) {
          await room.say(text, contact)
        } else {  // close event
          await talkRoomForConversationClosed(room, contact)
        }

      }

    })
  }

}

export { WechatyFreshdesk }

import {
  Wechaty,
  WechatyPlugin,
  log,
}                   from 'wechaty'
import {
  matchers,
  talkers,
}                   from 'wechaty-plugin-contrib'

import { freshdeskTalker } from './freshdesk/mod'
import { smeeWebhook }    from './smee'

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

function normalizeConfig (config: WechatyFreshdeskConfig) {
  const WECHATY_PLUGIN_FRESHDESK_WEBHOOK_PROXY_URL = 'WECHATY_PLUGIN_FRESHDESK_WEBHOOK_PROXY_URL'
  const WECHATY_PLUGIN_FRESHDESK_PORTAL_URL        = 'WECHATY_PLUGIN_FRESHDESK_PORTAL_URL'
  const WECHATY_PLUGIN_FRESHDESK_API_KEY           = 'WECHATY_PLUGIN_FRESHDESK_API_KEY'

  let portalUrl       = config.portalUrl
  let apiKey          = config.apiKey
  let webhookProxyUrl = config.webhookProxyUrl

  if (!portalUrl)       { portalUrl       = process.env[WECHATY_PLUGIN_FRESHDESK_PORTAL_URL] }
  if (!apiKey)          { apiKey          = process.env[WECHATY_PLUGIN_FRESHDESK_API_KEY] }
  if (!webhookProxyUrl) { webhookProxyUrl = process.env[WECHATY_PLUGIN_FRESHDESK_WEBHOOK_PROXY_URL] }

  if (!portalUrl) {
    throw new Error(`
      Wechaty Freshdesk Plugin requires Freshdesk Endpoint for authorization.
      Please set ${WECHATY_PLUGIN_FRESHDESK_PORTAL_URL} environment variable,
      or set 'freshdeskEndpoint' in plugin config.
    `)
  }

  if (!apiKey) {
    throw new Error(`
      Wechaty Freshdesk Plugin requires Freshdesk TOKEN for authorization.
      Please set ${WECHATY_PLUGIN_FRESHDESK_API_KEY} environment variable,
      or set 'freshdeskToken' in plugin config.
    `)
  }

  if (!webhookProxyUrl) {
    throw new Error(`
      Wechaty Freshdesk Plugin requires Webhook Proxy URL for receiving Freshdesk Conversation Replies.
      Please set ${WECHATY_PLUGIN_FRESHDESK_WEBHOOK_PROXY_URL} environment variable,
      or set 'webhookProxyUrl' in plugin config.
    `)
  }

  return {
    apiKey,
    portalUrl,
    webhookProxyUrl,
  }
}

export { WechatyFreshdesk }

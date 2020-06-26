import { WechatyFreshdeskConfig } from './plugin'

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

export { normalizeConfig }

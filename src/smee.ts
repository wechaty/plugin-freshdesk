import http from 'http'

import express    from 'express'
import bodyParser from 'body-parser'

import { log } from 'wechaty'

import { FreshdeskWebhookNotification } from './freshdesk/webhook'

const SmeeClient = require('smee-client')

type AdminReplyCallback = (contactId: string, text?: string) => void

function smeeWebhook (webhookProxyUrl : string) {
  log.verbose('Freshdesk', 'smeeWebhook(%s)', webhookProxyUrl)

  const app =  express()
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())

  const server = http.createServer(app)

  let events: any

  const listener = server.listen(0, () => {
    const port = (listener.address() as any).port

    const smee = new SmeeClient({
      logger: console,
      source: webhookProxyUrl,
      target: `http://127.0.0.1:${port}/smee`,
    })
    events = smee.start()
  })

  log.verbose('Freshdesk', 'smeeWebhook() is listening on port ' + (listener.address() as any).port)

  return function webhook (callback: AdminReplyCallback) {
    log.verbose('Freshdesk', 'webhook(callback)')

    app.post('/smee', freshdeskWebhook)

    return () => {
      // Stop forwarding events
      if (events) { events.close() }
      listener.close()
    }

    function freshdeskWebhook (req: express.Request, res: express.Response) {
      log.verbose('Freshdesk', 'smeeWebhook() freshdeskWebhook(req, res)')

      /**
       * "freshdesk_webhook":{
          "ticket_id":12
          "ticket_contact_unique_external_id":"lizhuohuan"
          "ticket_latest_public_comment":"Rui LI : <div style="font-family:-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif; font-size:14px"><div dir="ltr">Hi 李卓桓,<br><br>Good to hear from you!<br><br> </div></div>"
        }
       */
      const payload = req.body as FreshdeskWebhookNotification
      const contactId = payload.freshdesk_webhook.ticket_contact_unique_external_id

      const html = payload.freshdesk_webhook.ticket_latest_public_comment

      // https://www.tutorialspoint.com/how-to-remove-html-tags-from-a-string-in-javascript
      const text = html.replace(/(<([^>]+)>)/ig, '')

      // console.info(contactId, ': ', text)
      log.verbose('Freshdesk', 'freshdeskWebhook() ticket admin replied: %s -> %s',
        contactId,
        text,
      )
      callback(contactId, text)

      res.end()
    }

  }

}

export { smeeWebhook }

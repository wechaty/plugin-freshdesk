/* eslint-disable camelcase */

/**
"freshdesk_webhook":{
  "ticket_id":11
  "ticket_contact_unique_external_id":"lizhuohuan"
  "ticket_latest_public_comment":"Rui LI : <div style="font-family:-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif; font-size:14px"><div dir="ltr">test note</div></div>"
  }
*/

interface FreshdeskWebhookTicketAdminReplied {
  freshdesk_webhook: {
    ticket_id                         : number
    ticket_contact_unique_external_id : string,
    ticket_latest_public_comment      : string,
  }
}

// interface FreshdeskWebhookTicketAdminClosed {}

export type FreshdeskWebhookNotification = FreshdeskWebhookTicketAdminReplied

#!/usr/bin/env ts-node

import test  from 'tstest'

import { RestClient }             from 'typed-rest-client'
import { BasicCredentialHandler } from 'typed-rest-client/Handlers'

import * as api from './api'

const getClientFixture = () => {
  const apiKey    = 'dDth0V9ew7z7Iw4TW1tu'
  const portalUrl = 'https://juzibot.freshdesk.com/'

  const bearerHandler: BasicCredentialHandler = new BasicCredentialHandler(apiKey, 'X')
  const client = new RestClient(
    'WechatyPluginFreshdesk',
    portalUrl + '/api/v2/',
    [ bearerHandler ],
  )
  return client
}

test.skip('contactCreator()', async t => {
  const createContact = api.contactCreator(getClientFixture())
  const ret = await createContact({
    externalId: 'lizhuohuan',
    name: 'huan',
  })
  console.info('ret:', ret)
  t.ok(createContact)
})

test.skip('contactGetter()', async t => {
  const getContact = api.contactGetter(getClientFixture())
  const ret = await getContact('lizhuohuan')
  console.info('ret:', ret)
  t.ok(getContact)
})

test.skip('ticketCreator()', async t => {
  const createTicket = api.ticketCreator(getClientFixture())

  const ret = await createTicket({
    description : 'test desc',
    requesterId : 64004879462,
    subject     : 'test',
  })
  console.info('ret: ', ret)

  t.ok(createTicket)
})

test.skip('ticketGetter()', async t => {
  const getTicket = api.ticketGetter(getClientFixture())

  const ret = await getTicket(64004879462)
  console.info('ret: ', ret)

  t.ok(getTicket)
})

test.skip('ticketReplier()', async t => {
  const replyTicket = api.ticketReplier(getClientFixture())

  const ret = await replyTicket({
    body     : 'test reply',
    ticketId : 15,
    userId   : 64004879462,
  })
  console.info('ret: ', ret)

  t.ok(replyTicket)
})

#!/usr/bin/env ts-node

import test  from 'tstest'
import fs from 'fs'

import * as api from './api'

const getUnirestFixture = () => {
  const portalUrl = 'https://juzibot.freshdesk.com/'
  const apiKey    = ''

  const request = api.getUnirest(portalUrl, apiKey)
  return request
}

test.skip('contactCreator()', async t => {
  const createContact = api.contactCreator(getUnirestFixture())
  const ret = await createContact({
    externalId: 'lizhuohuan4',
    name: 'huan',
  })
  console.info('ret:', ret)
  t.ok(createContact)
})

test.skip('contactGetter()', async t => {
  const getContact = api.contactGetter(getUnirestFixture())
  const ret = await getContact('lizhuohuan')
  console.info('ret:', ret)
  t.ok(getContact)
})

test.skip('ticketCreator()', async t => {
  const createTicket = api.ticketCreator(getUnirestFixture())

  const ret = await createTicket({
    description : 'test desc',
    requesterId : 64004879462,
    subject     : 'test',
  })
  console.info('ret: ', ret)

  t.ok(createTicket)
})

test.skip('ticketGetter()', async t => {
  const getTicket = api.ticketGetter(getUnirestFixture())

  const ret = await getTicket(64004879462)
  console.info('ret: ', ret)

  t.ok(getTicket)
})

test.skip('ticketReplier()', async t => {
  const replyTicket = api.ticketReplier(getUnirestFixture())

  const ret = await replyTicket({
    body     : 'test reply',
    ticketId : 15,
    userId   : 64004879462,
  })
  console.info('ret: ', ret)

  t.ok(replyTicket)
})

test.skip('ticketCreator() with attachments', async t => {
  const createTicket = api.ticketCreator(getUnirestFixture())

  const ret = await createTicket({
    attachments: [
      fs.createReadStream('../../README.md'),
      fs.createReadStream('../../docs/images/freshdesk-wechaty.png'),
    ],
    description : 'test desc',
    requesterId : 64004879462,
    subject     : 'test',
  })
  console.info('ret: ', ret)

  t.ok(createTicket)
})

test.skip('ticketReplier() with attachments', async t => {
  const replyTicket = api.ticketReplier(getUnirestFixture())

  const ret = await replyTicket({
    attachments: [
      fs.createReadStream('../../README.md'),
      fs.createReadStream('../../docs/images/freshdesk-wechaty.png'),
    ],
    body     : 'test reply',
    ticketId : 15,
    userId   : 64004879462,
  })
  console.info('ret: ', ret)

  t.ok(replyTicket)
})

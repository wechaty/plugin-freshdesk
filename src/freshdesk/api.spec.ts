#!/usr/bin/env ts-node

import test  from 'tstest'

import path from 'path'

import { FileBox } from 'file-box'

import * as api from './api'

const getUnirestFixture = () => {
  const portalUrl = 'https://juzibot.freshdesk.com/'
  const apiKey    = process.env.WECHATY_PLUGIN_FRESHDESK_API_KEY

  if (!apiKey) {
    throw new Error('set WECHATY_PLUGIN_FRESHDESK_API_KEY to run me')
  }

  const request = api.getSimpleUnirest(portalUrl, apiKey)
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
      FileBox.fromFile(path.join(__dirname, '../../README.md')),
      FileBox.fromFile(path.join(__dirname, '../../docs/images/freshdesk-wechaty.png')),
    ],
    description : 'test desc with filebox',
    requesterId : 64004879462,
    subject     : 'test',
  })
  console.info('ret: ', ret)

  t.ok(createTicket)
})

test.skip('ticketReplier() with attachments', async t => {
  const replyTicket = api.ticketReplier(getUnirestFixture())

  const attachments = [
    FileBox.fromFile(path.join(__dirname, '../../README.md')),
    FileBox.fromFile(path.join(__dirname, '../../docs/images/freshdesk-wechaty.png')),
  ]

  const ret = await replyTicket({
    attachments,
    body     : 'test reply with filebox',
    ticketId : 21,
    userId   : 64004879462,
  })
  console.info('ret: ', ret)

  t.ok(replyTicket)
})

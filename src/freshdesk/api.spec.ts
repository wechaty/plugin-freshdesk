#!/usr/bin/env ts-node
/* eslint-disable camelcase */

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
  t.ok(createContact)

  const TWITTER_ID = 'lizhuohuan10'

  const ret = await createContact({
    name: 'huan',
    twitterId: TWITTER_ID,
  })
  // console.info('ret:', ret)

  t.true(ret, 'should create user and get payload')
  t.equal(ret?.twitter_id, TWITTER_ID, 'should get payload with expected twitter id')
})

test.skip('contactGetter()', async t => {
  const TWITTER_ID = 'lizhuohuan4'

  const getContact = api.contactGetter(getUnirestFixture())
  t.ok(getContact)

  const ret = await getContact(TWITTER_ID)
  // console.info('ret:', ret)

  t.true(ret, 'should get contact by twitter id')
  t.equal(ret?.twitter_id, TWITTER_ID, 'should get a non-empty payload')
})

test.skip('ticketCreator()', async t => {
  const createTicket = api.ticketCreator(getUnirestFixture())
  t.ok(createTicket)

  const ret = await createTicket({
    custom_fields:{
      cf_wechaty_contact : 'id_unit_testing',
      cf_wechaty_room    : 'id_unit_testing@chatroom',
    },
    description : 'test desc',
    requesterId : 64004879462,
    subject     : 'test',
  })
  console.info('ret: ', ret)

  t.true(Number.isInteger(ret), 'should get ticket number as integer')
  t.true(ret > 0, 'should get ticket number bigger than zero')
})

test.skip('ticketGetter()', async t => {
  const getTicket = api.ticketGetter(getUnirestFixture())

  let ret = await getTicket(123456)
  t.deepEqual(ret, [], 'should return a empty list for non-exists ticket id')

  ret = await getTicket(64004879462)
  t.true(Array.isArray(ret), 'should return a list of ticket payloads')

  console.info('ret: ', ret)

  t.ok(getTicket)
})

test('ticketReplier()', async t => {
  const replyTicket = api.ticketReplier(getUnirestFixture())
  t.ok(replyTicket)

  const ret = await replyTicket({
    body     : 'test reply',
    ticketId : 15,
    userId   : 64007191119,
  })
  console.info('ret: ', ret)

  t.true(Number.isInteger(ret), 'should be integer')
  t.true(ret > 0, 'should get number bigger than 0')
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

  const filebox = FileBox.fromFile(path.join(__dirname, '../../NOTICE'))

  const attachments = [
    FileBox.fromBase64(await filebox.toBase64(), '../../NOTICE'),
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

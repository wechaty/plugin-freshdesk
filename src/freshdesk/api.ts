/* eslint-disable camelcase */
import {
  FileBox,
}               from 'file-box'

import {
  Status,
  Priority,
  Source,
  TicketPayload,
}                           from './schema'
import {
  getSimpleUnirest,
  SimpleUnirest,
}                           from './unirest'
import { normalizeFileBox } from './normalize-file-box'

interface CreateTicketArgs {
  requesterId    : number,
  subject        : string,
  description    : string,
  attachments?   : FileBox[]
  custom_fields? : CustomFieldsPayload['custom_fields'],
}

interface ReplyTicketArgs {
  ticketId     : number,
  userId       : number,
  body         : string,
  attachments? : FileBox[],
}

interface CreateContactArgs {
  externalId : string,
  name       : string,
}

interface IdPayload {
  id: number
}

export interface CustomFieldsPayload {
  custom_fields: {
    cf_roomid?: null | string
  },
}

const ticketCreator = (rest: SimpleUnirest) => async (args: CreateTicketArgs): Promise<number> => {

  const DEFAULT_PAYLOAD = {
    priority           : Priority.Medium,
    source             : Source.Chat,
    status             : Status.Open,
  }

  let payload: TicketPayload = {
    custom_fields : args.custom_fields,
    description   : args.description,
    requester_id  : args.requesterId,
    subject       : args.subject,
  }

  payload = {
    ...DEFAULT_PAYLOAD,
    ...payload,
  }

  const request = rest.post<IdPayload>('tickets')

  if (args.attachments && args.attachments.length > 0) {
    request.field(payload)
    for (const box of args.attachments) {
      const { buf, info } = await normalizeFileBox(box)
      request.attach('attachments[]', buf, info)
    }
  } else {
    request.type('json')
    request.send(payload)
  }

  const ret = await request

  // console.info('ret:', ret.body)
  return ret.body.id
}

const ticketReplier = (rest: SimpleUnirest) => async (args: ReplyTicketArgs): Promise<number> => {
  const payload = {
    body    : args.body,
    user_id : args.userId,
  }

  const request = rest.post<IdPayload>(`tickets/${args.ticketId}/reply`)

  if (args.attachments && args.attachments.length > 0) {
    request.field(payload)

    for (const box of args.attachments) {
      const { buf, info } = await normalizeFileBox(box)
      request.attach('attachments[]', buf, info)
    }

  } else {
    request.type('json')
    request.send(payload)
  }

  const ret = await request
  //  as any as { body: IdPayload }

  // console.info('ret:', ret.body)
  return ret.body.id
}

const ticketGetter = (rest: SimpleUnirest) => async (
  requesterId: number
): Promise<(IdPayload & CustomFieldsPayload)[]> => {
  const query = `requester_id=${requesterId}`
  const ret = await rest.get<(IdPayload & CustomFieldsPayload)[]>(`tickets?${query}`)

  // console.info(ret.body)
  // return ret.map(p => p.id)

  if (Array.isArray(ret.body)) {
    return ret.body
  }
  return []

  // if (ret.body.length)  {
  //   return ret.body.map(p => p.id)
  // } else {
  //   return []
  // }

}

const contactCreator = (rest: SimpleUnirest) => async (args: CreateContactArgs): Promise<number> => {
  const payload = {
    name               : args.name,
    unique_external_id : args.externalId,
  }

  const ret = await rest
    .post<IdPayload>('contacts')
    .type('json')
    .send(payload)

  // TODO(huan): deal with HTTP non-200 error

  // console.info(ret.body)
  return ret.body.id
}

const contactGetter = (rest: SimpleUnirest) => async (externalId: string): Promise<undefined | number> => {
  const query = `unique_external_id:'${externalId}'`
  const ret = await rest
    .get<{ results: IdPayload[] }>(`search/contacts/?query="${query}"`)

  // console.info(ret.body)

  if (ret.body.results.length)  {
    return ret.body.results.map(p => p.id)[0]
  } else {
    return undefined
  }

}

export {
  normalizeFileBox,
  getSimpleUnirest,
  contactGetter,
  contactCreator,
  ticketCreator,
  ticketReplier,
  ticketGetter,
}

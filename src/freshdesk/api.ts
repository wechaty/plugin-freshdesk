/* eslint-disable camelcase */
import { RestClient }             from 'typed-rest-client'
import { BasicCredentialHandler } from 'typed-rest-client/Handlers'

import {
  Status,
  Priority,
  Source,
  TicketPayload,
  // ContactPayload,
}                   from './schema'

interface CreateTicketArgs {
  requesterId : number,
  subject     : string,
  description : string,
}

interface ReplyTicketArgs {
  ticketId : number,
  userId   : number,
  body     : string,
}

interface CreateContactArgs {
  externalId : string,
  name       : string,
}

const getClient = (
  portalUrl: string,
  apiKey: string,
) => {
  const bearerHandler: BasicCredentialHandler = new BasicCredentialHandler(apiKey, 'X')
  const client = new RestClient(
    'WechatyPluginFreshdesk',
    portalUrl + '/api/v2/',
    [ bearerHandler ],
  )
  return client
}

const ticketCreator = (client: RestClient) => async (args: CreateTicketArgs): Promise<number> => {
  const DEFAULT_PAYLOAD = {
    priority           : Priority.Low,
    source             : Source.Chat,
    status             : Status.Open,
  }

  const payload: TicketPayload = {
    description  : args.description,
    requester_id : args.requesterId,
    subject      : args.subject,
  }

  const ret = await client.create<{ id: number }>('tickets', {
    ...DEFAULT_PAYLOAD,
    ...payload,
  })

  // console.info('ret:', ret)
  return ret.result!.id
}

const ticketReplier = (client: RestClient) => async (args: ReplyTicketArgs): Promise<void> => {
  const payload = {
    body    : args.body,
    user_id : args.userId,
  }

  const ret = await client.create<{ id: number }>(
    `tickets/${args.ticketId}/reply`,
    payload,
  )
  void ret
  // console.info('ret:', ret.result)
}

const contactCreator = (client: RestClient) => async (args: CreateContactArgs): Promise<number> => {
  const payload = {
    name               : args.name,
    unique_external_id : args.externalId,
  }

  const ret = await client.create<{ id: number }>(
    `contacts`,
    payload,
  )
  return ret.result!.id
}

const ticketGetter = (client: RestClient) => async (requesterId: number): Promise<number[]> => {
  const query = `requester_id=${requesterId}`
  const ret = await client.get<{ id: number }[]>(
    `tickets?${query}`
  )

  // console.info(ret.result![0])

  if (ret.result?.length)  {
    return ret.result.map(p => p.id)
  } else {
    return []
  }

}

const contactGetter = (client: RestClient) => async (externalId: string): Promise<undefined | number> => {
  const query = `unique_external_id:'${externalId}'`
  const ret = await client.get<{ results: { id: number }[] }>(
    `search/contacts/?query="${query}"`
  )

  if (ret.result?.results.length)  {
    return ret.result.results.map(p => p.id)[0]
  } else {
    return undefined
  }

}

export {
  getClient,
  contactGetter,
  contactCreator,
  ticketCreator,
  ticketReplier,
  ticketGetter,
}

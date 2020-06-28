import stream from 'stream'

const unirest = require('unirest')

export interface FileInfo {
  contentType?: string,
  filename    : string,
  knownLength : number,
}

interface UnirestRequest<T> {
  then(cb: (result: { body: T }) => any): any
  attach: (formName: string, stream: stream.Readable, info?: FileInfo) => UnirestRequest<T>
  type: (t: 'json') => UnirestRequest<T>
  field: (payload: object) => UnirestRequest<T>
  send: (payload: object) => UnirestRequest<T>
  end: (resolve: (result: any) => void) => UnirestRequest<T>
}

export interface SimpleUnirest {
  get: <T=unknown>(url: string) => UnirestRequest<T>
  post: <T=unknown>(url: string) => UnirestRequest<T>
}

function getSimpleUnirest (
  portalUrl : string,
  apiKey    : string,
): SimpleUnirest {
  const auth = 'Basic ' + Buffer.from(apiKey + ':' + 'X').toString('base64')
  const headers = {
    'Authorization': auth,
  }
  const preUrl = portalUrl + '/api/v2/'

  return {
    get: (url: string) => unirest
      .get(preUrl + url)
      .headers(headers),

    post: (url: string) => unirest
      .post(preUrl + url)
      .headers(headers),
  }
}

export { getSimpleUnirest }

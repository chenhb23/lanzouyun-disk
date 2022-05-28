import {share} from '../../common/http'

export function directLinkInfo(link: string) {
  return new Promise<{lastModified: string; size: number; filename: string}>((resolve, reject) => {
    const stream = share.stream(link, {timeout: {connect: 5000}})
    stream.once('response', (response: typeof stream.response) => {
      const headers = response.headers
      // if (headers['content-type'] === 'application/octet-stream') {
      if (headers['content-type'] !== 'text/html') {
        const disposition = headers['content-disposition']
        resolve({
          lastModified: headers['last-modified'],
          size: +headers['content-length'],
          filename: disposition ? disposition.match(/filename=(.*)/)?.[1]?.trim() : link.split('/').pop(),
        })
      } else {
        reject('文件不是 application/octet-stream 类型')
      }
    })
    stream.once('error', error => reject(error.message))
  })
}

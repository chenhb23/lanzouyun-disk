/**
 * ua 去除 lanzouyun-pan 和 electron 字样
 */
export function safeUserAgent(userAgent: string) {
  const filters = ['lanzouyun-pan', 'electron']
  return Array.from(userAgent.matchAll(/([\w-]+?)\/([\d.]+( \(.+?\))?)/g))
    .filter(value => filters.every(item => item.toLowerCase() !== value[1].toLowerCase()))
    .map(value => value[0])
    .join(' ')
}

export const isMacOS = process.platform === 'darwin'

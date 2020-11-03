import React from 'react'
import './Message.css'
import {delay} from '../../common/util'

interface MessageOptions {
  message: string
  duration?: number
  type?: 'success' | 'info'
}

/**
 * todo: 新增icon标识
 */
export const message = {
  success(message: string, options?: Omit<MessageOptions, 'type'>) {
    return show({...options, message, type: 'success'})
  },
  info(message: string, options?: Omit<MessageOptions, 'type'>) {
    return show({...options, message, type: 'info'})
  },
  show(options: MessageOptions) {
    return show(options)
  },
}

function show({duration = 1500, type = 'success', message} = {} as MessageOptions) {
  const div = document.createElement('div')
  div.innerText = message
  div.className = `Message ${type}`

  document.body.appendChild(div)
  delay(100)
    .then(() => {
      div.classList.add('show')
      return delay(duration)
    })
    .then(() => hide(div))
  return () => hide(div)
}

async function hide(div: HTMLDivElement) {
  div.classList.remove('show')
  await delay(500)
  div.remove()
}

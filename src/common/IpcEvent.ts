enum IpcEvent {
  // handle
  trigger = 'trigger',
  store = 'store',
  dialog = 'dialog',
  shell = 'shell',

  // on
  download = 'download',
  abort = 'abort',
  logout = 'logout',

  // reply
  progressing = 'progressing',
  start = 'start',
  done = 'done',
  failed = 'failed',
  cancelled = 'cancelled',
}

export default IpcEvent

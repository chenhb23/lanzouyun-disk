import type {IpcExtension} from './extensions/ipc'
import type {ThemeExtension} from './extensions/theme'

type IpcEventApi<T> = Pick<
  T,
  {
    [P in keyof T]: T[P] extends (event: infer Event, ...args: any[]) => any
      ? Event extends Electron.IpcMainInvokeEvent | Electron.IpcMainEvent
        ? P
        : never
      : never
  }[keyof T]
>

type RenderApi<T> = {
  [K in keyof T]: T[K] extends (event: any, ...args: infer P) => infer R ? (...args: P) => R : never
}

export type ElectronApi = RenderApi<IpcEventApi<IpcExtension>> & RenderApi<IpcEventApi<ThemeExtension>>

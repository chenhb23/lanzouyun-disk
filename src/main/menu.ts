import {Extension} from './extension'
import {Menu} from 'electron'

export class AppMenu implements Extension {
  install(): void {
    if (process.platform !== 'darwin') {
      Menu.setApplicationMenu(null)
    }
  }
}

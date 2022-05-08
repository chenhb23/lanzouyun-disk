import {Extension} from './extension'
// import {Menu} from 'electron'

export class MenuExtension implements Extension {
  install(): void {
    // if (process.platform !== 'darwin') {
    //   Menu.setApplicationMenu(null)
    // }
  }
}

import {nativeTheme, ipcMain} from 'electron'
import {Extension} from './extension'
import {Application} from '../application'
import IpcEvent from '../../common/IpcEvent'

export class ThemeExtension implements Extension {
  setTheme = async (event: Electron.IpcMainInvokeEvent, theme: Electron.NativeTheme['themeSource']) => {
    if (nativeTheme.themeSource !== theme) {
      nativeTheme.themeSource = theme
    }
    return this.getTheme(event)
  }

  getTheme = async (event: Electron.IpcMainInvokeEvent) => {
    return {
      themeSource: nativeTheme.themeSource,
      shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
      inForcedColorsMode: nativeTheme.inForcedColorsMode,
      shouldUseInvertedColorScheme: nativeTheme.shouldUseInvertedColorScheme,
      shouldUseHighContrastColors: nativeTheme.shouldUseHighContrastColors,
    }
  }

  install(instance: Application): void {
    ipcMain.handle(IpcEvent['theme:setTheme'], this.setTheme)
    ipcMain.handle(IpcEvent['theme:getTheme'], this.getTheme)
  }
}

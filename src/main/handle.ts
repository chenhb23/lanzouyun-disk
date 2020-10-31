import {ipcMain} from 'electron'

ipcMain.handle('trigger', async (event, method: string, ...args) => {
  console.log(method, args)
  const [prefix, mod] = method.replace(/(\.{1,2}\/)?([\w.]+)$/, '$1,$2').split(',')
  let [module, ...func] = mod.split('.')
  if (prefix) {
    module = require(prefix + module).default;
  } else {
    module = require(module)
  }

  if (func.length === 1) {
    return module[func[0]](...args)
  } else {
    return module[func[0]][func[1]](...args)
  }
})

console.log('handle start')

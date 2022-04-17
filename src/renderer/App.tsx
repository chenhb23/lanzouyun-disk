import React, {useState} from 'react'
import {observer} from 'mobx-react'
import {basename} from 'path'
import electron from 'electron'

import './component/Icon/lib/iconfont.js'
import {Menu, MenuItem, MenuProvider} from './component/Menu'
import {TabPane, Tabs} from './component/Tabs'
import Upload from './page/Upload'
import Files from './page/Files'
import Download from './page/Download'
import Complete from './page/Complete'
import Parse from './page/Parse'
import SplitMerge from './page/SplitMerge'
import {download, upload} from './store'
import {Button} from './component/Button'
import IpcEvent from '../common/IpcEvent'
import {Icon} from './component/Icon'
import store from '../common/store'
import electronApi from './electronApi'
import './App.css'

const App = observer(() => {
  const [menu, setMenu] = useState('')

  function taskLength<T>(tasks: T[]) {
    const len = tasks?.length
    return len ? `（${len}）` : ''
  }

  return (
    <div className='App'>
      <main className='main'>
        <aside className='aside'>
          <div>
            <MenuProvider defaultKey={'1'} onChange={key => setMenu(key)}>
              <Menu>
                <MenuItem id={'1'} icon={'file'}>
                  全部文件
                </MenuItem>
              </Menu>
              <Menu title={'传输列表'}>
                <MenuItem id={'2'} icon={'upload'}>
                  正在上传 {taskLength(upload.list)}
                </MenuItem>
                <MenuItem id={'3'} icon={'download'}>
                  正在下载 {taskLength(download.list)}
                </MenuItem>
                <MenuItem id={'4'} icon={'finish'}>
                  已完成 {taskLength(download.finishList)}
                </MenuItem>
              </Menu>
              <Menu title={'实用工具'}>
                <MenuItem id={'5'} icon={'upload'}>
                  解析Url
                </MenuItem>
                <MenuItem id={'6'} icon={'split'}>
                  文件分割
                  {/*/ 合并*/}
                </MenuItem>
              </Menu>
            </MenuProvider>
          </div>

          <div className='logout'>
            <div title={download.dir} className='downFolder'>
              <span onClick={() => electron.ipcRenderer.invoke(IpcEvent.shell, 'showItemInFolder', download.dir)}>
                下载地址：
              </span>
              <Icon iconName={'folder'} />
              <span
                onClick={() => {
                  electron.ipcRenderer.invoke(IpcEvent.dialog).then((value: Electron.OpenDialogReturnValue) => {
                    if (!value.canceled) {
                      download.dir = value.filePaths[0]
                      store.set('downloads', download.dir)
                    }
                  })
                }}
              >
                {basename(download.dir)}
              </span>
            </div>
            <Button
              style={{width: '100%'}}
              onClick={() => {
                electronApi.logout()
              }}
            >
              退出登录
            </Button>
          </div>
        </aside>
        <div className='content'>
          <Tabs activeKey={menu}>
            <TabPane id={'1'}>
              <Files />
            </TabPane>
            <TabPane id={'2'}>
              <Upload />
            </TabPane>
            <TabPane id={'3'}>
              <Download />
            </TabPane>
            <TabPane id={'4'}>
              <Complete />
            </TabPane>
            <TabPane id={'5'}>
              <Parse />
            </TabPane>
            <TabPane id={'6'}>
              <SplitMerge />
            </TabPane>
          </Tabs>
        </div>
      </main>
    </div>
  )
})

export default App

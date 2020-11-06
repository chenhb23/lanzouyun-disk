import React, {useState} from 'react'
import './App.css'
import {observer} from 'mobx-react'
import {Menu, MenuItem, MenuProvider} from './component/Menu'
import {TabPane, Tabs} from './component/Tabs'
import Upload from './page/Upload'
import Files from './page/Files'
import Download from './page/Download'
import Complete from './page/Complete'
import Parse from './page/Parse'
import SplitMerge from './page/SplitMerge'
import download from './store/Download'
import upload from './store/Upload'
import request from '../common/request'
import {message} from './component/Message'

request.intercepter.response = res => {
  if (![1, 2].includes(res.zt)) {
    console.log(res)
    message.info(res.text)
  }
  return res
}

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
              <MenuItem id={'6'} icon={'download'}>
                文件分割 / 合并
              </MenuItem>
            </Menu>
          </MenuProvider>
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

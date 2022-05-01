import React, {useState} from 'react'
import {observer} from 'mobx-react'
import {basename} from 'path'

import './component/Icon/lib/iconfont.js'
import {Menu} from './component/Menu/Menu'
import {TabPane, Tabs} from './component/Tabs'
import Upload from './page/Upload'
import Files from './page/Files'
import Download from './page/Download'
import Complete from './page/Complete'
import Parse from './page/Parse'
import SplitMerge from './page/SplitMerge'
import {download, upload} from './store'
import {Button} from './component/Button'
import {Icon} from './component/Icon'
import store from '../common/store'
import electronApi from './electronApi'
import {config} from './store/Config'
import pkg from '../../package.json'
import {delay} from '../common/util'

import './App.css'
import project from '../project.config'

function taskLength<T>(tasks: T[]) {
  const len = tasks?.length
  return len ? `（${len}）` : ''
}

const recycleUrl = new URL(project.page.recycle, project.lanzouUrl).toString()

const App = observer(() => {
  const [activeKey, setActiveKey] = useState('1')
  const [visible, setVisible] = useState(true)

  return (
    <div className='App'>
      <main className='main'>
        <aside className='aside'>
          <Menu activeKey={activeKey} onChange={key => setActiveKey(key)}>
            <Menu.Title onClick={() => electronApi.openExternal('https://github.com/chenhb23/lanzouyun-disk')}>
              <Icon iconName={'github'} style={{fontSize: 14}} /> v{pkg.version}
            </Menu.Title>
            <Menu.Item id={'1'} icon={'file'}>
              全部文件
            </Menu.Item>
            <Menu.Item id={'7'} icon={'delete'}>
              回收站
              {activeKey === '7' && (
                <Icon
                  className='refresh'
                  iconName={'refresh'}
                  onClick={async () => {
                    setVisible(false)
                    await delay(1)
                    setVisible(true)
                  }}
                >
                  刷新
                </Icon>
              )}
            </Menu.Item>
            <Menu.Title>传输列表</Menu.Title>
            <Menu.Item id={'2'} icon={'upload'}>
              正在上传 {taskLength(upload.list)}
            </Menu.Item>
            <Menu.Item id={'3'} icon={'download'}>
              正在下载 {taskLength(download.list)}
            </Menu.Item>
            <Menu.Item id={'4'} icon={'finish'}>
              已完成 {taskLength(download.finishList)}
            </Menu.Item>
            <Menu.Title>实用工具</Menu.Title>
            <Menu.Item id={'5'} icon={'more'}>
              解析Url
            </Menu.Item>
            <Menu.Item id={'6'} icon={'split'}>
              文件分割
              {/*/ 合并*/}
            </Menu.Item>
          </Menu>

          <div className='logout'>
            <div title={download.dir} className='downFolder'>
              <span
                onClick={async () => {
                  await electronApi.showItemInFolder(download.dir)
                }}
              >
                下载地址：
              </span>
              <Icon iconName={'folder'} />
              <span
                onClick={async () => {
                  const value = await electronApi.showOpenDialog({properties: ['openDirectory']})
                  if (!value.canceled) {
                    download.dir = value.filePaths[0]
                    store.set('downloads', download.dir)
                  }
                }}
              >
                {basename(download.dir)}
              </span>
            </div>
            <Button
              style={{width: '100%'}}
              title={`最近登录: ${config.lastLogin}`}
              onClick={() => electronApi.logout()}
            >
              退出登录
            </Button>
          </div>
        </aside>
        <div className='content'>
          <Tabs activeKey={activeKey}>
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
            <TabPane id={'7'}>{visible && <webview src={recycleUrl} style={{height: '100%'}} />}</TabPane>
          </Tabs>
        </div>
      </main>
    </div>
  )
})

export default App

import React, {useState} from 'react'
import {observer} from 'mobx-react'

// 早点引入样式，确保后来的样式可以覆盖之前的
import './App.less'
import './component/Icon/lib/iconfont.js'

import {download, upload} from './store'
import {MyIcon} from './component/Icon'
import electronApi from './electronApi'
import pkg from '../../package.json'
import {delay} from '../common/util'
import project from '../project.config'
import {useLatestRelease} from './hook/useLatestRelease'
import {Touchable} from './component/Touchable'

import Upload from './page/Upload'
import Files from './page/Files'
import Download from './page/Download'
import Complete from './page/Complete'
import Parse from './page/Parse'
import SplitMerge from './page/SplitMerge'
import Setting from './page/Setting'

import {
  CheckCircleOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  ScissorOutlined,
  SettingOutlined,
} from '@ant-design/icons'

import {Layout, Menu, Tabs} from 'antd'

function taskLength<T>(tasks: T[]) {
  const len = tasks?.length
  return len ? `（${len}）` : ''
}

const recycleUrl = new URL(project.page.recycle, project.lanzouUrl).toString()

const App = observer(() => {
  const [activeKey, setActiveKey] = useState('1')
  const [visible, setVisible] = useState(true)
  const latestVersion = useLatestRelease()

  return (
    <Layout>
      <Layout.Sider theme={'light'}>
        <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
          <div style={{flex: 1}}>
            <div className='logo' style={{height: 46}} />
            <Menu
              inlineIndent={16}
              mode='inline'
              activeKey={activeKey}
              onClick={info => setActiveKey(info.key)}
              defaultSelectedKeys={[activeKey]}
              items={[
                {
                  type: 'group',
                  label: (
                    <>
                      <Touchable
                        title={'去 GitHub 点亮 star'}
                        onClick={() => electronApi.openExternal('https://github.com/chenhb23/lanzouyun-disk')}
                      >
                        <MyIcon iconName={'github'} style={{fontSize: 14}} /> v{pkg.version}
                      </Touchable>
                      {!!latestVersion && (
                        <Touchable
                          onClick={() => electronApi.openExternal(latestVersion.html_url)}
                          title={latestVersion.body}
                        >
                          （最新: {latestVersion.tag_name}）
                        </Touchable>
                      )}
                    </>
                  ),
                  children: [
                    {key: '1', label: '全部文件', icon: <FolderOpenOutlined />},
                    {
                      key: '7',
                      label: (
                        <span>
                          回收站
                          {activeKey === '7' && (
                            <MyIcon
                              className='refresh'
                              iconName={'refresh'}
                              onClick={async () => {
                                setVisible(false)
                                await delay(1)
                                setVisible(true)
                              }}
                            >
                              刷新
                            </MyIcon>
                          )}
                        </span>
                      ),
                      icon: <DeleteOutlined />,
                    },
                  ],
                },
                {
                  type: 'group',
                  label: '传输列表',
                  children: [
                    {key: '2', label: `正在上传 ${taskLength(upload.list)}`, icon: <CloudUploadOutlined />},
                    {key: '3', label: `正在下载 ${taskLength(download.list)}`, icon: <CloudDownloadOutlined />},
                    {key: '4', label: `已完成 ${taskLength(download.finishList)}`, icon: <CheckCircleOutlined />},
                  ],
                },
                {
                  type: 'group',
                  label: '实用工具',
                  children: [
                    {key: '5', label: '解析 URL', icon: <LinkOutlined />},
                    {key: '6', label: '文件分割', icon: <ScissorOutlined />},
                  ],
                },
                {type: 'divider', style: {margin: '12px 0'}},
                {key: '8', label: '设置', icon: <SettingOutlined />},
              ]}
            />
          </div>
          <div style={{padding: '30px 24px'}}></div>
        </div>
      </Layout.Sider>
      <Layout>
        <Layout.Content>
          <Tabs activeKey={activeKey} renderTabBar={() => null}>
            <Tabs.TabPane key={'1'}>
              <Files />
            </Tabs.TabPane>
            <Tabs.TabPane key={'2'}>
              <Upload />
            </Tabs.TabPane>
            <Tabs.TabPane key={'3'}>
              <Download />
            </Tabs.TabPane>
            <Tabs.TabPane key={'4'}>
              <Complete />
            </Tabs.TabPane>
            <Tabs.TabPane key={'5'}>
              <Parse />
            </Tabs.TabPane>
            <Tabs.TabPane key={'6'}>
              <SplitMerge />
            </Tabs.TabPane>
            <Tabs.TabPane key={'7'}>{visible && <webview src={recycleUrl} style={{height: '100%'}} />}</Tabs.TabPane>
            <Tabs.TabPane key={'8'}>
              <Setting />
            </Tabs.TabPane>
          </Tabs>
        </Layout.Content>
      </Layout>
    </Layout>
  )
})

export default App

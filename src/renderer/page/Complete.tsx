import React from 'react'
import {observer} from 'mobx-react'
import path from 'path'
import {MyScrollView} from '../component/ScrollView'
import {MyHeader} from '../component/Header'
import {MyIcon} from '../component/Icon'
import {byteToSize} from '../../common/util'
import electronApi from '../electronApi'
import {Button, Table, Tabs, Typography} from 'antd'
import {finish} from '../store/Finish'
import {taskLength} from '../utils/task'

const Complete = observer(() => {
  return (
    <Tabs tabPosition={'left'} tabBarStyle={{paddingTop: 46, minWidth: 110}}>
      <Tabs.TabPane tab={`同步${taskLength(finish.syncList)}`} key={'1'}>
        <MyScrollView
          HeaderComponent={
            <MyHeader>
              <Button onClick={() => (finish.syncList = [])}>清除全部记录</Button>
            </MyHeader>
          }
        >
          <Table
            pagination={false}
            size={'small'}
            rowKey={'uid'}
            dataSource={[...finish.syncList]}
            columns={[
              {
                title: '文件名',
                render: (_, item) => {
                  const name = item.upload.file.name
                  const extname = path.extname(name).replace(/^\./, '')

                  return (
                    <a href={'#'}>
                      <MyIcon iconName={extname} defaultIcon={'file'} />
                      <Typography.Text delete={item.trashOnFinish}>{name}</Typography.Text>
                    </a>
                  )
                },
              },
              {
                title: '大小',
                width: 200,
                render: (_, item) => `${byteToSize(item.upload.file.size)}`,
              },
              {
                title: '操作',
                width: 200,
                render: (_, item) => (
                  <Button
                    icon={<MyIcon iconName={'delete'} />}
                    size={'small'}
                    type={'text'}
                    title={'删除记录'}
                    onClick={async () => {
                      finish.syncList = finish.syncList.filter(value => value.uid !== item.uid)
                    }}
                  />
                ),
              },
            ]}
          />
        </MyScrollView>
      </Tabs.TabPane>
      <Tabs.TabPane tab={`上传${taskLength(finish.uploadList)}`} key={'2'}>
        <MyScrollView
          HeaderComponent={
            <MyHeader>
              <Button onClick={() => (finish.uploadList = [])}>清除全部记录</Button>
            </MyHeader>
          }
        >
          <Table
            pagination={false}
            size={'small'}
            rowKey={(record, index) => `${record.file.path}${index}`}
            dataSource={[...finish.uploadList]}
            columns={[
              {
                title: '文件名',
                render: (_, item) => {
                  const name = item.file.name
                  const extname = path.extname(name).replace(/^\./, '')

                  return (
                    <a href={'#'}>
                      <MyIcon iconName={extname} defaultIcon={'file'} />
                      <Typography.Text>{name}</Typography.Text>
                    </a>
                  )
                },
              },
              {
                title: '大小',
                width: 200,
                render: (_, item) => `${byteToSize(item.file.size)}`,
              },
              {
                title: '操作',
                width: 200,
                render: (_, item, index) => (
                  <Button
                    icon={<MyIcon iconName={'delete'} />}
                    size={'small'}
                    type={'text'}
                    title={'删除记录'}
                    onClick={async () => {
                      finish.uploadList = finish.uploadList.filter((_, i) => i !== index)
                    }}
                  />
                ),
              },
            ]}
          />
        </MyScrollView>
      </Tabs.TabPane>
      <Tabs.TabPane tab={`下载${taskLength(finish.downloadList)}`} key={'3'}>
        <MyScrollView
          HeaderComponent={
            <MyHeader>
              <Button onClick={() => (finish.downloadList = [])}>清除全部记录</Button>
            </MyHeader>
          }
        >
          <Table
            pagination={false}
            size={'small'}
            // Warning: [antd: Table] `index` parameter of `rowKey` function is deprecated. There is no guarantee that it will work as expected.
            rowKey={(record, index) => `${record.url}${index}`}
            dataSource={[...finish.downloadList]}
            columns={[
              {
                title: '文件名',
                render: (_, item) => {
                  const extname = path.extname(item.name).replace(/^\./, '')

                  return (
                    <a
                      href={'#'}
                      title={`打开文件：${item.name}`}
                      onClick={() => electronApi.openPath(path.join(item.dir, item.name))}
                    >
                      <MyIcon iconName={extname} defaultIcon={'file'} />
                      <Typography.Text title={item.dir}>{item.name}</Typography.Text>
                    </a>
                  )
                },
              },
              {
                title: '大小',
                width: 200,
                render: (_, item) => `${byteToSize(item.total)}`,
              },
              {
                title: '操作',
                width: 200,
                render: (_, item) => (
                  <Button
                    icon={<MyIcon iconName={'open-folder'} />}
                    size={'small'}
                    type={'text'}
                    onClick={async () => {
                      const filePath = path.join(item.dir, item.name)
                      await electronApi.showItemInFolder(filePath)
                    }}
                  />
                ),
              },
            ]}
          />
        </MyScrollView>
      </Tabs.TabPane>
    </Tabs>
  )
})

export default Complete

import React from 'react'
import {Observer, observer} from 'mobx-react'
import {MyScrollView} from '../component/ScrollView'
import {Button, Space, Table, Tag} from 'antd'
import {sync} from '../store/Sync'
import {SyncOutlined} from '@ant-design/icons'
import {MyIcon} from '../component/Icon'
import path from 'path'
import {TaskStatus} from '../store/AbstractTask'
import {MyHeader} from '../component/Header'

const Sync = observer(() => {
  return (
    <MyScrollView
      HeaderComponent={
        <MyHeader>
          <Space>
            {/*<Button onClick={() => sync.pauseAll()}>全部暂停</Button>*/}
            {/*<Button onClick={() => sync.startAll()}>全部开始</Button>*/}
            <Button onClick={() => sync.removeAll()}>全部删除</Button>
          </Space>
        </MyHeader>
      }
    >
      <Table
        pagination={false}
        size={'small'}
        rowKey={'uid'}
        dataSource={[...sync.list]}
        columns={[
          {
            title: '文件名',
            render: (_, record) => {
              return (
                <Observer>
                  {() => {
                    const name = record.download.name

                    if (!name) {
                      return (
                        <>
                          <MyIcon iconName={'file'} />
                          <span>未知</span>
                        </>
                      )
                    }

                    const extname = path.extname(name).replace(/^\./, '')
                    return (
                      <>
                        <MyIcon iconName={extname} defaultIcon={'file'} />
                        <span title={record.download.dir}>{name}</span>
                      </>
                    )
                  }}
                </Observer>
              )
            },
          },
          {
            title: '状态',
            width: 150,
            render: (_, record) => {
              return (
                <Observer>
                  {() => {
                    return (
                      <>
                        <Tag {...tagProps(record.step === 'download', record.download?.status)}>下载</Tag>
                        <Tag {...tagProps(record.step === 'upload', record.upload?.status)}>上传</Tag>
                      </>
                    )
                  }}
                </Observer>
              )
            },
          },
          {
            title: '操作',
            width: 120,
            render: (_, record) => (
              <Observer>
                {() => (
                  <>
                    {/*<Button
                      size={'small'}
                      type={'text'}
                      icon={
                        record.status === TaskStatus.pending ? (
                          <MyIcon iconName={'pause'} />
                        ) : (
                          <MyIcon iconName={'start'} />
                        )
                      }
                      onClick={() => {
                        if (record.status === TaskStatus.pending) {
                          sync.pause(record.uid)
                        } else {
                          sync.start(record.uid, true)
                        }
                      }}
                    />*/}
                    <Button
                      size={'small'}
                      type={'text'}
                      icon={<MyIcon iconName={'delete'} />}
                      onClick={() => sync.remove(record.uid)}
                    />
                  </>
                )}
              </Observer>
            ),
          },
        ]}
      />
    </MyScrollView>
  )
})

export default Sync

function tagProps(showIcon: boolean, status: TaskStatus) {
  return {
    icon: showIcon ? <SyncOutlined spin={status === TaskStatus.pending} /> : undefined,
    color: status === TaskStatus.finish ? 'success' : status === TaskStatus.pending ? 'processing' : 'default',
  }
}

import React from 'react'
import {observer, Observer} from 'mobx-react'
import {MyScrollView} from '../component/ScrollView'
import {MyHeader} from '../component/Header'
import {MyIcon} from '../component/Icon'
import {byteToSize} from '../../common/util'
import {download} from '../store'
import {TaskStatus} from '../store/AbstractTask'
import path from 'path'
import {Button, Progress, Space, Table} from 'antd'

const Download = observer(() => {
  return (
    <MyScrollView
      HeaderComponent={
        <MyHeader>
          <Space>
            <Button onClick={() => download.pauseAll()}>全部暂停</Button>
            <Button onClick={() => download.startAll()}>全部开始</Button>
            <Button onClick={() => download.removeAll()}>全部删除</Button>
          </Space>
        </MyHeader>
      }
    >
      <Table
        pagination={false}
        size={'small'}
        rowKey={'url'}
        dataSource={[...download.list]}
        columns={[
          {
            title: '文件名',
            render: (_, item) => {
              const extname = path.extname(item.name).replace(/^\./, '')

              return (
                <>
                  <MyIcon iconName={extname} defaultIcon={'file'} />
                  <span title={item.dir}>{item.name}</span>
                </>
              )
            },
          },
          {
            title: '大小',
            width: 150,
            render: (_, item) => (
              <Observer>{() => <span>{`${byteToSize(item.resolve)} / ${byteToSize(item.total)}`}</span>}</Observer>
            ),
          },
          {
            title: '状态',
            width: 200,
            render: (_, item) => (
              <Observer>
                {() => (
                  <Progress
                    style={{paddingRight: 16}}
                    strokeColor={{from: '#4C89F7', to: '#87d068'}}
                    format={percent => percent.toFixed(1) + '%'}
                    percent={(item.resolve / item.total) * 100}
                    status={item.status === TaskStatus.pending ? 'active' : 'normal'}
                  />
                )}
              </Observer>
            ),
          },
          {
            title: '操作',
            width: 120,
            render: (_, item) => (
              <>
                <Observer>
                  {() => (
                    <Button
                      size={'small'}
                      type={'text'}
                      icon={
                        item.status === TaskStatus.pending ? (
                          <MyIcon iconName={'pause'} />
                        ) : (
                          <MyIcon iconName={'start'} />
                        )
                      }
                      onClick={() => {
                        if (item.status === TaskStatus.pending) {
                          download.pause(item.url)
                        } else {
                          download.start(item.url, true)
                        }
                      }}
                    />
                  )}
                </Observer>

                <Button
                  size={'small'}
                  icon={<MyIcon iconName={'delete'} />}
                  type={'text'}
                  onClick={() => download.remove(item.url)}
                />
              </>
            ),
          },
        ]}
      />
    </MyScrollView>
  )
})

export default Download

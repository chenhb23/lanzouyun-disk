import React from 'react'
import {MyScrollView} from '../component/ScrollView'
import {MyHeader} from '../component/Header'
import {MyIcon} from '../component/Icon'
import {byteToSize} from '../../common/util'
import {UploadTask} from '../store/Upload'
import {upload} from '../store'
import {Observer, observer} from 'mobx-react'
import {TaskStatus, TaskStatusName} from '../store/AbstractTask'
import path from 'path'
import {Button, Modal, Space, Table} from 'antd'
import {SpeedProgress} from '../component/SpeedProgress'

const Upload = observer(() => {
  const showSubTask = (task: UploadTask) => {
    Modal.success({
      width: 600,
      maskClosable: true,
      icon: null,
      okText: '关闭',
      title: task.file.name,
      content: (
        <MyScrollView style={{maxHeight: 400, minHeight: 200}}>
          {task.tasks?.map(item => (
            <p key={item.name}>{`${item.name}  /  ${TaskStatusName[item.status]}`}</p>
          ))}
        </MyScrollView>
      ),
    })
  }

  return (
    <MyScrollView
      HeaderComponent={
        <MyHeader>
          <Space>
            <Button onClick={() => upload.pauseAll()}>全部暂停</Button>
            <Button onClick={() => upload.startAll()}>全部开始</Button>
            <Button onClick={() => upload.removeAll()}>全部删除</Button>
          </Space>
        </MyHeader>
      }
    >
      <Table
        pagination={false}
        size={'small'}
        rowKey={record => record.file.path}
        dataSource={[...upload.list]}
        columns={[
          {
            title: '文件名',
            render: (_, item) => {
              const extname = path.extname(item.file.name).replace(/^\./, '')
              return (
                <Observer>
                  {() => (
                    <a href={'#'} onClick={() => showSubTask(item)}>
                      <MyIcon iconName={extname} defaultIcon={'file'} />
                      <span>{item.file.name}</span>
                      {item.tasks?.length > 1 && (
                        <span>{` | ${item.tasks.filter(value => value.status === TaskStatus.finish).length} / ${
                          item.tasks.length
                        }`}</span>
                      )}
                    </a>
                  )}
                </Observer>
              )
            },
          },
          {
            title: '大小',
            width: 150,
            render: (_, item) => (
              <Observer>{() => <span>{`${byteToSize(item.resolve)} / ${byteToSize(item.file.size)}`}</span>}</Observer>
            ),
          },
          {
            title: '状态',
            width: 200,
            render: (_, item) => (
              <Observer>
                {() => <SpeedProgress resolve={item.resolve} status={item.status} total={item.file.size} />}
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
                          upload.pause(item.file.path)
                        } else {
                          upload.start(item.file.path, true)
                        }
                      }}
                    />
                  )}
                </Observer>
                <Button
                  size={'small'}
                  type={'text'}
                  icon={<MyIcon iconName={'delete'} />}
                  onClick={() => upload.remove(item.file.path)}
                />
              </>
            ),
          },
        ]}
      />
    </MyScrollView>
  )
})

export default Upload

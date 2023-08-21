import React, {useCallback, useImperativeHandle, useRef, useState} from 'react'
import {observer, Observer} from 'mobx-react'
import {MyScrollView} from '../component/ScrollView'
import {MyHeader} from '../component/Header'
import {MyIcon} from '../component/Icon'
import {byteToSize, parseShare} from '../../common/util'
import {download} from '../store'
import {TaskStatus, TaskStatusName} from '../store/AbstractTask'
import path from 'path'
import {Button, Col, Form, Input, message, Modal, Row, Space, Table} from 'antd'
import {MinusCircleFilled} from '@ant-design/icons'
import {SpeedProgress} from '../component/SpeedProgress'
import {DownloadTask} from '../store/task/DownloadTask'
import {URLType} from '../../common/core/ls'

const Download = observer(() => {
  const batchRef = useRef(null)

  return (
    <MyScrollView
      HeaderComponent={
        <MyHeader>
          <Space>
            <Button onClick={() => download.pauseAll()}>全部暂停</Button>
            <Button onClick={() => download.startAll()}>全部开始</Button>
            <Button onClick={() => download.removeAll()}>全部删除</Button>
            <Button type={'primary'} onClick={() => batchRef.current.show()}>
              新建批量下载
            </Button>
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
            render: (_, item) => (
              <Observer>
                {() => {
                  if (!item.name) {
                    return (
                      <>
                        <MyIcon iconName={'file'} />
                        <span>未知</span>
                      </>
                    )
                  }

                  const extname = path.extname(item.name).replace(/^\./, '')
                  return (
                    <>
                      <MyIcon
                        iconName={extname}
                        defaultIcon={'file'}
                        onClick={() => {
                          if (item.urlType !== URLType.folder) return
                          Modal.confirm({
                            icon: null,
                            width: 700,
                            title: `文件列表 (${item.tasks.length})`,
                            maskClosable: true,
                            content: (
                              <div className={'max-h-96 overflow-y-auto'}>
                                {item.tasks.map(task => {
                                  return (
                                    <div key={task.url} className={'mb-1'}>
                                      {task.name} | {TaskStatusName[task.status]}
                                    </div>
                                  )
                                })}
                              </div>
                            ),
                            cancelButtonProps: {className: 'hidden'},
                          })
                        }}
                      />
                      <span title={item.dir}>{item.name}</span>
                    </>
                  )
                }}
              </Observer>
            ),
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
                {() => <SpeedProgress total={item.total} resolve={item.resolve} status={item.status} />}
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

      <BatchTask ref={batchRef} />
    </MyScrollView>
  )
})

export default Download

// 批量下载
function _BatchTask(_, ref) {
  const [visible, setVisible] = useState(false)
  const [form] = Form.useForm<{urls: string; list: ReturnType<typeof parseShare>[]}>()

  useImperativeHandle(ref, () => ({
    show: () => setVisible(true),
  }))

  const parseUrl = useCallback(
    (value: string) =>
      value
        .split(/\n/)
        .filter(item => item.includes('http'))
        .map(item =>
          item
            .split(' ')
            .filter(el => el)
            .reduceRight<string[]>((prev, item) => {
              if (prev.every(el => !/^https?:\/\//.test(el))) {
                return [item, ...prev]
              }
              return prev
            }, [])
            .join(' ')
        )
        .map(parseShare),
    []
  )

  return (
    <Modal
      destroyOnClose
      visible={visible}
      width={650}
      title={'批量下载任务'}
      okText={'下载'}
      bodyStyle={{maxHeight: 500, minHeight: 300, overflowY: 'scroll'}}
      onCancel={() => setVisible(false)}
      onOk={() => form.submit()}
      afterClose={() => form.resetFields()}
    >
      <Form
        colon={false}
        form={form}
        initialValues={{list: []}}
        onFinish={async values => {
          if (!values.list?.length) return message.error('列表不能为空')
          const tasks = values.list.filter(item => item.url)
          const count = await download.addTasks(tasks.map(value => new DownloadTask(value)))
          message.success(`添加 ${count} 项到下载列表`)
          setVisible(false)
        }}
      >
        <Row gutter={6}>
          <Col flex={1}>
            <Form.Item name={'urls'} labelCol={{flex: '30px'}} style={{marginBottom: 0}}>
              <Input.TextArea
                allowClear
                autoFocus
                // style={{whiteSpace: 'nowrap'}}
                autoSize={{minRows: 3, maxRows: 5}}
                placeholder={'一个一行。格式：[文件名 ]https://....[ 密码|提取码:xxxx]'}
              />
            </Form.Item>
          </Col>
          <Col flex={'130px'}>
            <Form.Item noStyle shouldUpdate={(prev, next) => prev.urls !== next.urls}>
              {() => (
                <Button
                  disabled={!form.getFieldValue('urls')}
                  block
                  type={'primary'}
                  style={{height: '100%'}}
                  onClick={() => {
                    const {list, urls} = form.getFieldsValue()
                    const lefts = parseUrl(urls).filter(item => list.every(el => el.url !== item.url))
                    if (lefts.length) {
                      form.setFieldsValue({list: [...list, ...lefts]})
                    }
                    message.open({type: lefts.length ? 'success' : 'warning', content: `新增 ${lefts.length} 项`})
                  }}
                >
                  解析
                </Button>
              )}
            </Form.Item>
          </Col>
        </Row>

        <Form.List name={'list'}>
          {(fields, operation) =>
            fields.map(field => {
              return (
                <Row key={field.key} gutter={6} align={'middle'} style={{marginTop: 6}}>
                  <Col flex={1}>
                    <Form.Item
                      label={field.name + 1}
                      labelCol={{flex: '30px'}}
                      name={[field.name, 'url']}
                      style={{marginBottom: 0}}
                    >
                      <Input placeholder={'分享链接'} />
                    </Form.Item>
                  </Col>
                  <Col flex={'100px'}>
                    <Form.Item colon name={[field.name, 'pwd']} style={{marginBottom: 0}}>
                      <Input allowClear placeholder={'密码'} />
                    </Form.Item>
                  </Col>
                  <Col flex={'30px'}>
                    <MinusCircleFilled onClick={() => operation.remove(field.name)} />
                  </Col>
                </Row>
              )
            })
          }
        </Form.List>
      </Form>
    </Modal>
  )
}

const BatchTask = React.forwardRef(_BatchTask)

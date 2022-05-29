import React, {useCallback, useState} from 'react'
import {Button, Col, Form, Input, message, Row, Table, Upload} from 'antd'
import {InboxOutlined} from '@ant-design/icons'
import {MyScrollView} from '../../component/ScrollView'
import path from 'path'
import electronApi from '../../electronApi'
import fs from 'fs-extra'
import {MyIcon} from '../../component/Icon'
import {asyncFilter} from '../../../common/util'
import {merge} from '../../../common/merge'
import {useLoading} from '../../hook/useLoading'

export default function MergePage() {
  const [form] = Form.useForm<{dir: string; name: string}>()
  const [files, setFiles] = useState<{path: string; name: string}[]>([])
  const {loading, listener} = useLoading()

  const readDir = useCallback(async (filepath: string) => {
    const stat = await fs.stat(filepath)
    const dir = stat.isFile() ? path.dirname(filepath) : filepath
    const filenames = await fs.readdir(dir)
    const names = await asyncFilter(filenames, async filename => {
      const fstat = await fs.stat(path.join(dir, filename))
      return fstat.isFile()
    })
    setFiles(names.map(name => ({path: path.join(dir, name), name})))
  }, [])

  return (
    <MyScrollView
      FooterComponent={
        <>
          <Form
            form={form}
            labelCol={{flex: '66px'}}
            wrapperCol={{style: {paddingRight: 20}}}
            onFinish={async values => {
              try {
                const output = path.join(values.dir, values.name)
                if (fs.existsSync(output)) {
                  return message.warn(
                    <span>
                      文件已存在
                      <Button type={'link'} size={'small'} onClick={() => electronApi.openPath(output)}>
                        打开文件
                      </Button>
                    </span>
                  )
                }
                await listener(
                  merge(
                    files.map(value => value.path),
                    output
                  ),
                  'merge'
                )
                message.success(
                  <span>
                    合并成功
                    <Button type={'link'} size={'small'} onClick={() => electronApi.showItemInFolder(output)}>
                      打开目录
                    </Button>
                    或
                    <Button type={'link'} size={'small'} onClick={() => electronApi.openPath(output)}>
                      打开文件
                    </Button>
                  </span>
                )
              } catch (e: any) {
                message.error(e.message)
              }
            }}
          >
            <Form.Item label={'输出'} style={{marginBottom: 0}}>
              <Row>
                <Col flex={1}>
                  <Form.Item
                    label={null}
                    name={'dir'}
                    rules={[{required: true}]}
                    help={
                      <>
                        <span>目录</span>
                        <Button
                          type={'text'}
                          size={'small'}
                          onClick={async () => {
                            const folder = await electronApi.showOpenDialog({
                              properties: ['openDirectory', 'createDirectory'],
                            })
                            if (!folder.canceled) {
                              form.setFieldsValue({dir: folder.filePaths[0]})
                            }
                          }}
                        >
                          (选择)
                        </Button>
                      </>
                    }
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col>
                  <Form.Item label={null} wrapperCol={{style: {paddingLeft: 3, paddingRight: 3}}}>
                    {path.sep}
                  </Form.Item>
                </Col>
                <Col flex={1}>
                  <Form.Item label={null} name={'name'} rules={[{required: true}]} help={'文件名'}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col style={{marginLeft: 5}}>
                  <Button type={'primary'} htmlType={'submit'} disabled={!files.length} loading={loading['merge']}>
                    合并
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Form>
          <div
            onClick={async () => {
              const dir = await electronApi.showOpenDialog({properties: ['openDirectory']})
              if (!dir.canceled) {
                readDir(dir.filePaths[0])
              }
            }}
          >
            <Upload.Dragger
              onDrop={event => {
                const filepath = event.dataTransfer.files.item(0).path
                readDir(filepath)
              }}
              openFileDialogOnClick={false}
              showUploadList={false}
              beforeUpload={() => Upload.LIST_IGNORE}
            >
              <InboxOutlined style={{fontSize: 50, color: '#4C89F7'}} />
              <p>拖动文件（夹）到此处，或点击选择文件夹</p>
            </Upload.Dragger>
          </div>
        </>
      }
    >
      <Table
        pagination={false}
        rowKey={'name'}
        size={'small'}
        sticky
        dataSource={files}
        columns={[
          {
            title: '文件名',
            dataIndex: 'name',
            sorter: (a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1),
          },
          {
            title: '操作',
            width: 200,
            render: (_, record) => {
              return (
                <Button
                  type={'text'}
                  size={'small'}
                  title={'移除'}
                  icon={<MyIcon iconName={'delete'} />}
                  onClick={() => setFiles(prev => prev.filter(value => value.name !== record.name))}
                >
                  移除
                </Button>
              )
            },
          },
        ]}
      />
    </MyScrollView>
  )
}

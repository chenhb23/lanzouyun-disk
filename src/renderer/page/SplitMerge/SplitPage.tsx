import React, {useCallback, useEffect, useState} from 'react'
import {Button, Col, Form, Input, InputNumber, message, Row, Select, Table, Upload} from 'antd'
import {config} from '../../store/Config'
import {InboxOutlined} from '@ant-design/icons'
import {byteToSize, getSuffix} from '../../../common/util'
import {MyScrollView} from '../../component/ScrollView'
import {splitTask} from '../../../common/split'
import {useLoading} from '../../hook/useLoading'
import path from 'path'
import projectConfig, {supportList} from '../../../project.config'
import electronApi from '../../electronApi'
import debounce from 'lodash.debounce'
import {split} from '../../../common/merge'
import fs from 'fs-extra'

const leftList = supportList.filter(value => !projectConfig.safeSuffixList.includes(value))

export default function SplitPage() {
  const [splitInfo, setSplitInfo] = useState<ReturnType<typeof splitTask>>()
  const {loading, listener} = useLoading()
  const [file, setFile] = useState<File>(null)

  const [form] = Form.useForm<{dir: string; folder: string; name: string; ext: string; size: number}>()

  const setSplitFile = useCallback(
    (file?: File) => {
      if (file) {
        const dirname = path.dirname(file.path)
        const folder = `[parts]${file.name}`
        form.setFieldsValue({
          dir: dirname,
          folder,
          name: file.name,
          ...(!form.getFieldValue('ext') ? {ext: getSuffix()} : {}),
        })
        const values = form.getFieldsValue()
        const task = splitTask({file, splitSize: `${values.size}m`, suffix: values.ext, filename: values.name})
        setSplitInfo(task)
      } else {
        setSplitInfo(undefined)
      }
    },
    [form]
  )
  const updateInfo = useCallback(
    debounce(() => {
      const values = form.getFieldsValue()
      if (file && values.ext && values.name) {
        const task = splitTask({file, splitSize: `${values.size}m`, suffix: values.ext, filename: values.name})
        setSplitInfo(task)
      }
    }, 500),
    [file, form]
  )

  useEffect(() => {
    setSplitFile(file)
  }, [file, setSplitFile])

  return (
    <MyScrollView
      FooterComponent={
        <>
          {!!file && (
            <Form
              form={form}
              initialValues={{
                size: parseInt(config.splitSize),
              }}
              labelCol={{flex: '66px'}}
              wrapperCol={{style: {paddingRight: 20}}}
              style={{paddingTop: 10}}
              onFinish={async values => {
                const output = path.join(values.dir, values.folder)
                try {
                  await listener(split(splitInfo.splitFiles, output), 'split')
                  message.success(
                    <span>
                      分割完成
                      <Button type={'link'} size={'small'} onClick={() => electronApi.showItemInFolder(output)}>
                        打开目录
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
                  <Col span={7}>
                    <Form.Item label={null} name={'folder'} help={'文件夹'} rules={[{required: true}]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col>
                    <Form.Item label={null} wrapperCol={{style: {paddingLeft: 3, paddingRight: 3}}}>
                      {path.sep}
                    </Form.Item>
                  </Col>
                  <Col span={7}>
                    <Form.Item label={null} name={'name'} help={'文件名'} rules={[{required: true}]}>
                      <Input onChange={updateInfo} />
                    </Form.Item>
                  </Col>
                  <Col>
                    <Form.Item label={null} wrapperCol={{style: {paddingLeft: 3, paddingRight: 3}}}></Form.Item>
                  </Col>
                  <Col flex={'180px'}>
                    <Form.Item
                      label={null}
                      help={'拓展名'}
                      name={'ext'}
                      rules={[{required: true}]}
                      getValueProps={value => ({value: value ? value.split('.') : []})}
                      getValueFromEvent={event => (event?.length ? event.slice(-2).join('.') : '')}
                    >
                      <Select showArrow mode={'multiple'} onChange={updateInfo}>
                        <Select.OptGroup label={'无文件校验'}>
                          {projectConfig.safeSuffixList.map((value, index) => (
                            <Select.Option key={`${value}-${index}`} value={value}>
                              {value}
                            </Select.Option>
                          ))}
                        </Select.OptGroup>
                        <Select.OptGroup label={'有文件校验'}>
                          {leftList.map((value, index) => (
                            <Select.Option key={`${value}-${index}`} value={value}>
                              {value}
                            </Select.Option>
                          ))}
                        </Select.OptGroup>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>

              <Row>
                <Col flex={1}>
                  <Form.Item
                    wrapperCol={{flex: '250px'}}
                    label={'文件大小'}
                    name={'size'}
                    help={`单个文件最大: ${config.splitSize}`}
                    required={false}
                    rules={[{required: true}]}
                  >
                    <InputNumber
                      onChange={updateInfo}
                      style={{width: '100%'}}
                      min={1}
                      max={parseInt(config.splitSize)}
                      addonAfter={'m'}
                    />
                  </Form.Item>
                </Col>
                <Col flex={'200px'}>
                  <Form.Item label={null}>
                    <Button type={'primary'} disabled={!splitInfo} loading={loading['split']} block htmlType={'submit'}>
                      开始分割
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          )}
          <Upload.Dragger
            showUploadList={false}
            customRequest={async options => {
              const file = options.file as File
              const stat = await fs.stat(file.path)
              if (stat.isFile()) {
                setFile(file)
              }
            }}
          >
            <InboxOutlined style={{fontSize: 50, color: '#4C89F7'}} />
            <p>拖动文件到此处，或点击选择文件</p>
          </Upload.Dragger>
        </>
      }
    >
      <Table
        pagination={false}
        rowKey={'name'}
        size={'small'}
        sticky
        dataSource={splitInfo?.splitFiles}
        columns={[
          {
            title: `分割文件名` + (splitInfo?.splitFiles ? `(${splitInfo.splitFiles.length}项)` : ''),
            dataIndex: 'name',
          },
          {title: '大小', width: 180, render: (_, record) => byteToSize(record.size)},
        ]}
      />
    </MyScrollView>
  )
}

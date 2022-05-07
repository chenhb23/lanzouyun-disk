import React, {useCallback, useState} from 'react'
import {MyScrollView} from '../component/ScrollView'
import {MyIcon} from '../component/Icon'
import {splitTask} from '../../common/split'
import {useLoading} from '../hook/useLoading'
import {split} from '../../common/merge'
import {byteToSize} from '../../common/util'
import path from 'path'
import {config} from '../store/Config'
import electronApi from '../electronApi'
import {MyHeader} from '../component/Header'
import {Button, Col, message, Row, Space, Table, Upload} from 'antd'

import './SplitMerge.css'

export default function SplitMerge() {
  const [splitInfo, setSplitInfo] = useState<ReturnType<typeof splitTask>>()
  const [output, setOutput] = useState('')
  const {loading, listener} = useLoading()

  const setSplitFile = useCallback((file?: File) => {
    if (file) {
      const task = splitTask(file, config.splitSize)
      setSplitInfo(task)
      setOutput(`${task.file.path}.split`)
    } else {
      setSplitInfo(undefined)
      setOutput('')
    }
  }, [])

  return (
    <MyScrollView
      HeaderComponent={
        <>
          <MyHeader>
            <Space size={12}>
              <Upload customRequest={options => setSplitFile(options.file as File)} showUploadList={false}>
                <Button type={'primary'}>选择文件</Button>
              </Upload>
              {!!splitInfo && (
                <span>
                  <MyIcon iconName={path.extname(splitInfo.file.name).replace(/^\./, '')} defaultIcon={'file'} />
                  文件名: {splitInfo.file.name}, 文件类型: {splitInfo.file.type}
                </span>
              )}
            </Space>
          </MyHeader>
        </>
      }
      FooterComponent={
        <Row align={'middle'} style={{padding: '10px 20px'}}>
          <Col flex={1}>
            <Space>
              <a title={'打开路径'} href={'#'} onClick={() => electronApi.showItemInFolder(output)}>
                输出路径:{' '}
              </a>
              <a
                href={'#'}
                title={'选择输出路径'}
                onClick={async () => {
                  const value = await electronApi.showOpenDialog({properties: ['openDirectory']})
                  if (!value.canceled) {
                    setOutput(value.filePaths[0])
                  }
                }}
              >
                {output}
              </a>
            </Space>
          </Col>
          <Col>
            <Button
              type={'primary'}
              disabled={!splitInfo}
              loading={loading['split']}
              onClick={async () => {
                await listener(split(splitInfo.splitFiles, output), 'split')
                message.success('分割完成')
              }}
            >
              开始分割
            </Button>
          </Col>
        </Row>
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

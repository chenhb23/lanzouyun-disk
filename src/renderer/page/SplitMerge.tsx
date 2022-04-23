import React, {useCallback, useState} from 'react'
import {ScrollView} from '../component/ScrollView'
import {Icon} from '../component/Icon'
import {Button} from '../component/Button'
import {splitTask} from '../../common/split'
import {useLoading} from '../hook/useLoading'
import {split} from '../../common/merge'
import './SplitMerge.css'
import {byteToSize} from '../../common/util'
import Table from '../component/Table'
import {message} from '../component/Message'
import path from 'path'
import {config} from '../store/Config'
import electronApi from '../electronApi'

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
    <ScrollView
      style={{padding: '20px 10px'}}
      HeaderComponent={
        <div className={'select'}>
          <Button
            type={'primary'}
            file
            onChange={files => {
              Array.prototype.map.call(files, (file: File) => {
                setSplitFile(file)
              })
            }}
          >
            选择文件
          </Button>
          {!!splitInfo && (
            <div style={{marginLeft: 20}}>
              <Icon iconName={path.extname(splitInfo.file.name).replace(/^\./, '')} defaultIcon={'file'} />
              文件名: {splitInfo.file.name}, 文件类型: {splitInfo.file.type}
            </div>
          )}
        </div>
      }
      FooterComponent={
        <div className={'footer'}>
          <span className='output'>
            <span onClick={() => electronApi.showItemInFolder(output)}>输出路径: </span>
            <span
              onClick={async () => {
                const value = await electronApi.showOpenDialog({properties: ['openDirectory']})
                if (!value.canceled) {
                  setOutput(value.filePaths[0])
                }
              }}
            >
              {output}
            </span>
          </span>
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
        </div>
      }
    >
      <Table
        rowKey={'name'}
        dataSource={splitInfo?.splitFiles}
        columns={[
          {
            title: `分割文件名` + (splitInfo?.splitFiles ? `(${splitInfo.splitFiles.length}项)` : ''),
            dataIndex: 'name',
          },
          {title: '大小', render: record => byteToSize(record.size)},
        ]}
      />
    </ScrollView>
  )
}

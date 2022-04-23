import React from 'react'
import {observer} from 'mobx-react'
import path from 'path'
import electron from 'electron'
import {ScrollView} from '../component/ScrollView'
import {Header} from '../component/Header'
import {Button} from '../component/Button'
import {Bar} from '../component/Bar'
import {Icon} from '../component/Icon'
import {byteToSize} from '../../common/util'
import {download} from '../store'
import IpcEvent from '../../common/IpcEvent'
import Table from '../component/Table'
import electronApi from '../electronApi'

const Complete = observer(() => {
  return (
    <ScrollView
      HeaderComponent={
        <>
          <Header>
            <Button
              onClick={() => {
                download.removeAllFinish()
              }}
            >
              清除全部记录
            </Button>
          </Header>
          <Bar>
            <span>已完成</span>
          </Bar>
        </>
      }
    >
      <Table
        rowKey={(record, index) => `${record.url}${index}`}
        dataSource={[...download.finishList]}
        columns={[
          {
            title: '文件名',
            render: item => {
              const extname = path.extname(item.name).replace(/^\./, '')

              return (
                <>
                  <Icon iconName={extname} defaultIcon={'file'} />
                  <span title={item.dir}>{item.name}</span>
                </>
              )
            },
          },
          {
            title: '大小',
            render: item => `${byteToSize(item.total)}`,
          },
          {
            title: '操作',
            render: item => (
              <Button
                icon={'open-folder'}
                type={'icon'}
                onClick={async () => {
                  const filePath = path.join(item.dir, item.name)
                  await electronApi.showItemInFolder(filePath)
                }}
              />
            ),
          },
        ]}
      />
    </ScrollView>
  )
})

export default Complete

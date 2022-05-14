import React from 'react'
import {observer} from 'mobx-react'
import path from 'path'
import {MyScrollView} from '../component/ScrollView'
import {MyHeader} from '../component/Header'
import {MyIcon} from '../component/Icon'
import {byteToSize} from '../../common/util'
import {download} from '../store'
import electronApi from '../electronApi'
import {Button, Table} from 'antd'

const Complete = observer(() => {
  return (
    <MyScrollView
      HeaderComponent={
        <MyHeader>
          <Button
            onClick={() => {
              download.removeAllFinish()
            }}
          >
            清除全部记录
          </Button>
        </MyHeader>
      }
    >
      <Table
        pagination={false}
        size={'small'}
        // Warning: [antd: Table] `index` parameter of `rowKey` function is deprecated. There is no guarantee that it will work as expected.
        rowKey={(record, index) => `${record.url}${index}`}
        dataSource={[...download.finishList]}
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
                  <span title={item.dir}>{item.name}</span>
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
  )
})

export default Complete

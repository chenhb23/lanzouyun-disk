import React from 'react'
import {ScrollView} from '../component/ScrollView'
import {Header} from '../component/Header'
import {Button} from '../component/Button'
import {downloadManager} from '../../common/manager/DownloadManager'
import {Bar} from '../component/Bar'
import {Icon} from '../component/Icon'
import {byteToSize} from '../../common/util'
import {Table} from '../component/Table'

export default function Complete() {
  return (
    <ScrollView
      HeaderComponent={
        <>
          <Header>
            <Button
              onClick={() => {
                downloadManager.removeAllFinish()
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
      <Table header={['文件名', '大小', '操作']}>
        {downloadManager.finishTasks.map(item => {
          return (
            <tr key={item.id}>
              <td>
                <Icon iconName={'file'} />
                <span>{item.fileName}</span>
              </td>
              <td>{`${byteToSize(item.size)}`}</td>
              <td>{/*todo:操作*/}</td>
              <td></td>
            </tr>
          )
        })}
      </Table>
    </ScrollView>
  )
}

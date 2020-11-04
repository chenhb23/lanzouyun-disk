import React from 'react'
import {ScrollView} from '../component/ScrollView'
import {Header} from '../component/Header'
import {Button} from '../component/Button'
import {Bar} from '../component/Bar'
import {downloadManager} from '../../common/manager/DownloadManager'
import {Icon} from '../component/Icon'
import {byteToSize} from '../../common/util'
import {Table} from '../component/Table'

export default function Download() {
  return (
    <ScrollView
      HeaderComponent={
        <>
          <Header>
            <Button>全部暂停</Button>
            <Button>全部开始</Button>
            <Button>全部删除</Button>
          </Header>
          <Bar>
            <span>正在下载</span>
          </Bar>
        </>
      }
    >
      <Table header={['文件名', '大小', '操作']}>
        {downloadManager.tasks.map(item => {
          return (
            <tr key={item.id}>
              <td>
                <Icon iconName={'file'} />
                <span>{item.fileName}</span>
              </td>
              <td>{`${byteToSize(item.resolve)} / ${byteToSize(item.size)}`}</td>
              <td>{/*todo:操作*/}</td>
              <td></td>
            </tr>
          )
        })}
      </Table>
    </ScrollView>
  )
}

import React from 'react'
import {observer} from 'mobx-react'
import {ScrollView} from '../component/ScrollView'
import {Header} from '../component/Header'
import {Button} from '../component/Button'
import {Bar} from '../component/Bar'
import {Icon} from '../component/Icon'
import {byteToSize} from '../../common/util'
import {Table} from '../component/Table'
import {download} from '../store'
import {TaskStatus} from '../store/AbstractTask'
import {useRequest} from '../hook/useRequest'

const Download = observer(() => {
  const {loading, request} = useRequest()

  return (
    <ScrollView
      HeaderComponent={
        <>
          <Header>
            <Button onClick={() => download.pauseAll()}>全部暂停</Button>
            <Button onClick={() => download.startAll()}>全部开始</Button>
            <Button onClick={() => download.removeAll()}>全部删除</Button>
          </Header>
          <Bar>
            <span>正在下载</span>
          </Bar>
        </>
      }
    >
      <Table header={['文件名', '大小', '操作']}>
        {download.list.map(item => {
          return (
            <tr key={item.url}>
              <td>
                <Icon iconName={'file'} />
                <span>{item.name}</span>
              </td>
              <td>{`${byteToSize(item.resolve)} / ${byteToSize(item.size)}`}</td>
              <td>
                <Button
                  icon={item.status === TaskStatus.pending ? 'pause' : 'start'}
                  type={'icon'}
                  loading={loading['start']}
                  onClick={() => {
                    if (item.status === TaskStatus.pending) {
                      download.pause(item.url)
                    } else {
                      request(download.start(item.url, true), 'start')
                    }
                  }}
                />

                <Button icon={'delete'} type={'icon'} onClick={() => download.remove(item.url)} />
              </td>
              <td />
            </tr>
          )
        })}
      </Table>
    </ScrollView>
  )
})

export default Download

import React from 'react'
import {observer} from 'mobx-react'
import {ScrollView} from '../component/ScrollView'
import {Header} from '../component/Header'
import {Button} from '../component/Button'
import {Bar} from '../component/Bar'
import {Icon} from '../component/Icon'
import {byteToSize} from '../../common/util'
import {Table} from '../component/Table'
import download from '../store/Download'

const Download = observer(() => {
  console.log(download.list.map(item => item.tasks).map(item => item.reduce((total, item) => total + item.resolve, 0)))

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
        {download.list.map(item => {
          return (
            <tr key={item.url}>
              <td>
                <Icon iconName={'file'} />
                <span>{item.name}</span>
              </td>
              <td>{`${byteToSize(item.resolve)} / ${byteToSize(item.size)}`}</td>
              <td>
                {/*todo:操作*/}
                {item.tasks.reduce((total, item) => total + item.resolve, 0)}
              </td>
              <td></td>
            </tr>
          )
        })}
      </Table>
    </ScrollView>
  )
})

export default Download

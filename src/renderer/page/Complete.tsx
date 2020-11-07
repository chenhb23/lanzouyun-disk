import React from 'react'
import {ScrollView} from '../component/ScrollView'
import {Header} from '../component/Header'
import {Button} from '../component/Button'
import {Bar} from '../component/Bar'
import {Icon} from '../component/Icon'
import {byteToSize} from '../../common/util'
import {Table} from '../component/Table'
import download from '../store/Download'
import IpcEvent from '../../common/IpcEvent'
import requireModule from '../../common/requireModule'
import {observer} from 'mobx-react'
const electron = requireModule('electron')

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
      <Table header={['文件名', '大小', '操作']}>
        {download.finishList.map(item => {
          return (
            <tr key={item.url}>
              <td>
                <Icon iconName={'file'} />
                <span>{item.name}</span>
              </td>
              <td>{`${byteToSize(item.size)}`}</td>
              <td>
                <Button
                  onClick={() => {
                    // todo: 精确到文件
                    electron.ipcRenderer.invoke(IpcEvent.shell, 'showItemInFolder', item.path)
                  }}
                >
                  打开
                </Button>
              </td>
              <td></td>
            </tr>
          )
        })}
      </Table>
    </ScrollView>
  )
})

export default Complete

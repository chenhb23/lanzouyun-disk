import React from 'react'
import {ScrollView} from '../component/ScrollView'
import {Header} from '../component/Header'
import {Button} from '../component/Button'
import {Bar} from '../component/Bar'
import {Icon} from '../component/Icon'
import {byteToSize, isSpecificFile, restoreFileName} from '../../common/util'
import {Table} from '../component/Table'
import {download} from '../store'
import IpcEvent from '../../common/IpcEvent'
import {observer} from 'mobx-react'
import * as path from 'path'
import * as electron from 'electron'

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
        {download.finishList.map((item, i) => {
          return (
            <tr key={`${item.url}${i}`}>
              <td>
                <Icon iconName={'file'} />
                <span title={item.dir}>{item.name}</span>
              </td>
              <td>{`${byteToSize(item.total)}`}</td>
              <td>
                <Button
                  icon={'open-folder'}
                  type={'icon'}
                  onClick={() => {
                    // todo: 判断文件是否存在
                    const task = item.tasks[0]
                    let filePath = path.join(task.dir, task.name)
                    if (isSpecificFile(filePath)) {
                      filePath = restoreFileName(filePath)
                    }
                    electron.ipcRenderer.invoke(IpcEvent.shell, 'showItemInFolder', filePath)
                  }}
                />
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

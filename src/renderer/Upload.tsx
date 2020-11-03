import React from 'react'
import {observer} from 'mobx-react'
import {uploadManager} from '../common/manager/UploadManager'
import {Icon} from './component/Icon'
import {byteToSize} from '../common/util'
import {Table} from './component/Table'

export const Upload = observer(() => {
  return (
    <Table header={['文件名', '大小', '操作']}>
      {Object.keys(uploadManager.tasks).map(key => {
        const item = uploadManager.tasks[key]
        return (
          <tr key={key}>
            <td>
              <Icon iconName={'file'} />
              <span>{item.fileName}</span>
            </td>
            <td>{`${byteToSize(item.resolve)} / ${byteToSize(item.size)}`}</td>
            <td>i</td>
            <td></td>
          </tr>
        )
      })}
    </Table>
  )
})

import React from 'react'
import {Progress} from 'antd'
import {useRate} from '../hook/useRate'
import {byteToSize} from '../../common/util'
import {TaskStatus} from '../store/AbstractTask'

import './SpeedProgress.less'
import {DownloadTask} from '../store/task/DownloadTask'

export const SpeedProgress = (props: Pick<DownloadTask, 'total' | 'resolve' | 'status'>) => {
  const diff = useRate(props.resolve)

  return (
    <Progress
      className={'SpeedProgress'}
      strokeWidth={4}
      strokeColor={{'0%': '#D8DDF6', '50%': '#4C89F7', '100%': '#87d068'}}
      format={percent => (
        <span className={'SpeedProgressText'}>
          {percent.toFixed(1) + '%'}
          {diff ? ` - ${byteToSize(diff, 1000)}/s` : ''}
        </span>
      )}
      percent={(props.resolve / props.total) * 100}
      status={props.status === TaskStatus.pending ? 'active' : 'normal'}
    />
  )
}

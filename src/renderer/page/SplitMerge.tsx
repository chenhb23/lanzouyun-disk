import React from 'react'
import {ScrollView} from '../component/ScrollView'
import {Icon} from '../component/Icon'

export default function SplitMerge() {
  return (
    <ScrollView>
      <div style={{display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <Icon iconName={'empty'} style={{width: 100, height: 100}} />
        <span>功能开发中...</span>
      </div>
    </ScrollView>
  )
}

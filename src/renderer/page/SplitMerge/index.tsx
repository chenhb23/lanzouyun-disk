import React from 'react'
import {Tabs} from 'antd'

import './SplitMerge.css'
import SplitPage from './SplitPage'
import MergePage from './MergePage'

export default function SplitMerge() {
  return (
    <Tabs tabPosition={'left'} tabBarStyle={{paddingTop: 46, minWidth: 110}}>
      <Tabs.TabPane tab={'分割'} key={'1'} style={{paddingLeft: 0}}>
        <SplitPage />
      </Tabs.TabPane>
      <Tabs.TabPane tab={'合并'} key={'2'} style={{paddingLeft: 0}}>
        <MergePage />
      </Tabs.TabPane>
    </Tabs>
  )
}

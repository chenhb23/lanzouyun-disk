import React from 'react'
import {ScrollView} from '../component/ScrollView'
import {Header} from '../component/Header'
import {Button} from '../component/Button'

export default function SplitMerge() {
  return (
    <ScrollView
      HeaderComponent={
        <Header>
          <Button>test</Button>
        </Header>
      }
    >
      {Array.from({length: 50}).map((_, i) => (
        <p key={i}>{i}</p>
      ))}
    </ScrollView>
  )
}

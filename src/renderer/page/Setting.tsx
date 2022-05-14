import React from 'react'
import {Button, Checkbox, Col, Form, Input, Modal, Radio, Row, Space} from 'antd'
import {observer} from 'mobx-react'
import {MyScrollView} from '../component/ScrollView'
import {config} from '../store/Config'
import electronApi from '../electronApi'
import {download, upload} from '../store'
import {TaskStatus} from '../store/AbstractTask'

const Setting = observer(() => {
  return (
    <MyScrollView style={{paddingTop: 60, paddingLeft: 30}}>
      <Form labelAlign={'left'} colon={false} labelCol={{flex: '100px', style: {fontWeight: 'bold'}}}>
        {/*todo:*/}
        <Form.Item label={'统计'}>
          <Button title={'暂未开放'} type={'link'} disabled>
            查看
          </Button>
        </Form.Item>
        <Form.Item label={'外观'}>
          <Radio.Group
            defaultValue={config.themeSource}
            onChange={async e => {
              const theme = await electronApi.setTheme(e.target.value)
              config.themeSource = theme.themeSource
            }}
          >
            <Radio.Button value={'light'}>浅色</Radio.Button>
            <Radio.Button value={'dark'}>深色</Radio.Button>
            <Radio.Button value={'system'}>跟随系统</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item label={'下载位置'} wrapperCol={{flex: '400px'}}>
          <SelectDownloadDir />
        </Form.Item>
        <Form.Item label={'最后登录'}>{config.lastLogin}</Form.Item>
        <Form.Item label={'账号'} style={{marginTop: 60}}>
          <Button
            onClick={() => {
              if ([download.list, upload.list].some(value => value.some(task => task.status === TaskStatus.pending))) {
                Modal.confirm({
                  content: '有正在上传/下载的任务，是否继续退出？',
                  okText: '退出',
                  onOk: () => electronApi.logout(),
                })
              } else {
                electronApi.logout()
              }
            }}
          >
            退出登录
          </Button>
        </Form.Item>
        {/*<Form.Item label={'关于'} style={{marginTop: 60}}>
          <Space direction={'vertical'}>
            <span>蓝奏云盘</span>
            <span>v12.2</span>
          </Space>
        </Form.Item>*/}
      </Form>
    </MyScrollView>
  )
})

export default Setting

// 选择地址的组件
export const SelectDownloadDir = observer(() => (
  <Space direction={'vertical'} style={{width: '100%'}}>
    <Row gutter={12}>
      <Col flex={1}>
        <Input value={config.downloadDir} />
      </Col>
      <Col>
        <Button
          type={'link'}
          onClick={async () => {
            const value = await electronApi.showOpenDialog({properties: ['openDirectory', 'createDirectory']})
            if (!value.canceled) {
              config.downloadDir = value.filePaths[0]
            }
          }}
        >
          更改
        </Button>
        <Button type={'link'} onClick={() => electronApi.showItemInFolder(config.downloadDir)}>
          打开
        </Button>
      </Col>
    </Row>
    <Checkbox checked={config.setDefaultDownloadDir} onChange={e => (config.setDefaultDownloadDir = e.target.checked)}>
      默认此地址为下载路径
    </Checkbox>
  </Space>
))

// 选择下载地址
export function getDownloadDir() {
  return new Promise<string>((resolve, reject) => {
    if (config.setDefaultDownloadDir) {
      resolve(config.downloadDir)
    } else {
      Modal.confirm({
        title: '选择下载路径',
        icon: null,
        maskClosable: true,
        content: <SelectDownloadDir />,
        onCancel: () => reject(),
        onOk: () => resolve(config.downloadDir),
      })
    }
  })
}

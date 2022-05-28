import {LsFiles, URLType} from '../../../common/core/ls'
import {Col, Divider, Form, Input, Modal, ModalProps, Row, Space, Switch} from 'antd'
import {AccessData} from '../../../common/core/edit'
import React, {useState} from 'react'
import {asyncMap} from '../../../common/util'
import {fileDetail, folderDetail} from '../../../common/core/detail'

interface SetAccessModalProps {
  visible: boolean
  rows: LsFiles[]
  onCancel: ModalProps['onCancel']
  onOk: (data: AccessData[]) => Promise<void>
}

export function SetAccessModal(props: SetAccessModalProps) {
  const [loading, setLoading] = useState(false)

  const visible = props.visible
  const [form] = Form.useForm<
    Pick<AccessData, 'shows' | 'shownames'> & {
      _setAll: boolean
      rows: (AccessData & Pick<LsFiles, 'name'>)[]
    }
  >()

  return (
    <Modal
      visible={visible}
      title={'批量设置访问密码'}
      onCancel={props.onCancel}
      afterClose={() => form.resetFields()}
      confirmLoading={loading}
      onOk={() => form.submit()}
      destroyOnClose
    >
      <Form
        form={form}
        colon={false}
        labelCol={{flex: '75px'}}
        onFinish={() => {
          const values: AsyncReturnType<typeof form.validateFields> = form.getFieldsValue(true)
          const accessDatas = values._setAll
            ? props.rows.map(value => ({
                id: value.id,
                type: value.type,
                shows: values.shows,
                shownames: values.shownames,
              }))
            : values.rows.map(value => ({
                id: value.id,
                type: value.type,
                shows: value.shows,
                shownames: value.shownames,
              }))
          setLoading(true)
          props.onOk(accessDatas).finally(() => setLoading(false))
        }}
        initialValues={{shows: 1, _setAll: true}}
      >
        <Form.Item label={'批量设置'} name={'_setAll'} valuePropName={'checked'}>
          <Switch
            onChange={async checked => {
              if (!checked && !form.getFieldValue('rows')?.length) {
                const rows = await asyncMap(props.rows, async value => {
                  const result =
                    (await value.type) === URLType.file ? await fileDetail(value.id) : await folderDetail(value.id)
                  return {
                    id: value.id,
                    type: value.type,
                    name: value.name,
                    shows: `${result.onof}` === '1' ? 1 : 0,
                    shownames: result.pwd,
                  } as AsyncReturnType<typeof form.validateFields>['rows'][number]
                })
                form.setFieldsValue({rows})
              }
            }}
          />
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(prev, next) => prev._setAll !== next._setAll}>
          {f =>
            f.getFieldValue('_setAll') ? (
              <Form.Item label={'密码'}>
                <Row align={'middle'} gutter={12}>
                  <Col flex={1}>
                    <Form.Item noStyle name={'shownames'}>
                      <Input autoFocus maxLength={6} showCount placeholder={'该密码会应用于所有文件和文件夹'} />
                    </Form.Item>
                  </Col>
                  <Col>
                    <label>
                      <Space>
                        <Form.Item
                          noStyle
                          name={'shows'}
                          valuePropName={'checked'}
                          getValueProps={value => ({checked: value === 1})}
                          getValueFromEvent={event => (event ? 1 : 0)}
                        >
                          <Switch />
                        </Form.Item>
                        密码开关
                      </Space>
                    </label>
                  </Col>
                </Row>
              </Form.Item>
            ) : (
              <>
                <Divider plain>列表</Divider>
                <Form.List name={'rows'}>
                  {fields =>
                    fields.map(field => (
                      <Form.Item key={field.key} help={form.getFieldValue(['rows', field.name, 'name'])}>
                        <Row align={'middle'} gutter={12} wrap={false}>
                          <Col flex={1}>
                            <Form.Item noStyle name={[field.name, 'shownames']}>
                              <Input autoFocus maxLength={6} showCount placeholder={'请输入密码'} />
                            </Form.Item>
                          </Col>
                          <Col>
                            <label>
                              <Space>
                                <Form.Item
                                  noStyle
                                  name={[field.name, 'shows']}
                                  valuePropName={'checked'}
                                  getValueProps={value => ({checked: value === 1})}
                                  getValueFromEvent={event => (event ? 1 : 0)}
                                >
                                  <Switch />
                                </Form.Item>
                                密码开关
                              </Space>
                            </label>
                          </Col>
                        </Row>
                      </Form.Item>
                    ))
                  }
                </Form.List>
              </>
            )
          }
        </Form.Item>
      </Form>
    </Modal>
  )
}

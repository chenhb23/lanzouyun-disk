import {Form, Input, message, Modal, ModalProps} from 'antd'
import {useLoading} from '../../hook/useLoading'
import React, {useEffect} from 'react'
import {fileDescription, setFileDescription} from '../../../common/core/detail'

export function FileDescModal(props: {fileId: FileId; onCancel: ModalProps['onCancel']; onOk: () => void}) {
  const visible = !!props.fileId
  const {loading, listener} = useLoading()

  const [form] = Form.useForm<{desc: string}>()
  useEffect(() => {
    if (props.fileId) {
      fileDescription(props.fileId).then(value => {
        form.setFieldsValue({desc: value.info})
      })
    }
  }, [form, props.fileId])

  return (
    <Modal
      visible={visible}
      title={'添加文件描述'}
      onCancel={props.onCancel}
      okText={'修改'}
      onOk={() => form.submit()}
      afterClose={() => form.resetFields()}
      confirmLoading={loading['setFileDescription']}
      destroyOnClose
    >
      <Form
        form={form}
        layout={'vertical'}
        onFinish={async values => {
          const res = await listener(setFileDescription(props.fileId, values.desc), 'setFileDescription')
          props.onOk()
          message.success(res.info)
        }}
      >
        <Form.Item label={'文件描述'} name={'desc'} rules={[{required: true}]}>
          <Input.TextArea
            placeholder={'文件描述只允许修改一次,建议160字数以内。'}
            autoFocus
            allowClear
            maxLength={160}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

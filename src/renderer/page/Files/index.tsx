import React, {useCallback, useEffect, useMemo, useState} from 'react'
import electron from 'electron'
import {MyHeader} from '../../component/Header'
import {MyIcon} from '../../component/Icon'
import {asyncMap, delay, isFile, parseShare, sizeToByte} from '../../../common/util'
import {rm} from '../../../common/core/rm'
import {ls, LsFiles, URLType} from '../../../common/core/ls'
import {MyBar} from '../../component/Bar'
import {useLoading} from '../../hook/useLoading'
import {MyScrollView} from '../../component/ScrollView'
import {mkdir} from '../../../common/core/mkdir'
import {download, upload} from '../../store'
import {fileDetail, folderDetail, share} from '../../../common/core/detail'
import {editFile, editFileInfo, editFolder, setAccess} from '../../../common/core/edit'
import {countTree, mv} from '../../../common/core/mv'

import './Files.css'

import {
  Breadcrumb,
  Button,
  Checkbox,
  Col,
  Dropdown,
  Form,
  Input,
  Menu,
  message,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Space,
  Table,
  Upload,
} from 'antd'

import {CloudUploadOutlined, RightOutlined} from '@ant-design/icons'
import {getDownloadDir} from '../Setting'
import {FileDescModal} from './FileDescModal'
import {SetAccessModal} from './SetAccessModal'
import {SelectFolderModal} from './SelectFolderModal'
import {UploadTask} from '../../store/task/UploadTask'
import {DownloadTask} from '../../store/task/DownloadTask'
import {sync} from '../../store/Sync'
import {DownloadLinkTask} from '../../store/task/DownloadLinkTask'
import {SyncTask} from '../../store/task/SyncTask'
import {Rule} from 'rc-field-form/lib/interface'

interface FolderForm {
  folder_id?: FolderId // 如果有 folder_id 则是编辑
  name: string
  folderDesc: string
}

export default function Files() {
  const [visible, setVisible] = useState(false)
  const [folderForm] = Form.useForm<FolderForm>()

  const [fileModalVisible, setFileModalVisible] = useState(false)
  const [fileForm] = Form.useForm<{file_id: FileId; name: string}>()

  const [accessVisible, setAccessVisible] = useState(false)
  const {loading, listener, listenerFn} = useLoading()

  const [uploadMaskVisible, setUploadMaskVisible] = useState(false)

  const [list, setList] = useState({text: [], info: []} as AsyncReturnType<typeof ls>)
  const crumbs = useMemo(() => [{name: '全部文件', folderid: -1}, ...(list?.info || [])], [list?.info])

  const [search, setSearch] = useState('')
  const renderList = useMemo(
    () =>
      search
        ? {
            ...list,
            text: list.text?.filter(item => {
              const name = item.name.toLowerCase()
              return name.includes(search.toLowerCase())
            }),
          }
        : list,
    [list, search]
  )

  const currentFolder = crumbs[crumbs.length - 1]

  const listFile = useCallback(
    async (folder_id: FolderId) => {
      const value = await listener(ls(folder_id), 'ls')
      setList(value)
    },
    [listener]
  )
  // 进入下一层目录自动把搜索结果和所选择的项清除
  const lsNextFolder = async (folderId: FolderId) => {
    await listFile(folderId)
    setSearch('')
    setSelectedRows([])
  }
  const rmFiles = async (files: LsFiles[], loadingKey: string) => {
    await listenerFn(async () => {
      for (const item of files) {
        await rm(item.id, item.type === URLType.file)
      }
    }, loadingKey)
    message.success('删除成功')
    setSelectedRows(prev => prev.filter(value => files.every(item => item.id !== value.id)))
    listFile(currentFolder.folderid)
  }

  useEffect(() => {
    listFile(-1)
  }, [listFile])

  useEffect(() => {
    const refresh = () => listFile(currentFolder.folderid)
    upload.on('finish', refresh)
    return () => {
      upload.removeListener('finish', refresh)
    }
  }, [currentFolder.folderid, listFile])

  const [selectedRows, setSelectedRows] = useState<AsyncReturnType<typeof ls>['text']>([])

  const [moveInfo, setMoveInfo] = useState<{folderId: FolderId; rows: LsFiles[]}>(null)

  const downloadFile = useCallback(async (list: LsFiles[]) => {
    const tasks = await asyncMap(list, async item => {
      if (item.type === URLType.file) {
        const {f_id, is_newd, pwd, onof} = await fileDetail(item.id)
        return new DownloadTask({
          url: `${is_newd}/${f_id}`,
          pwd: `${onof}` === '1' ? pwd : undefined,
          urlType: item.type,
          name: item.name,
          merge: false,
        })
      } else {
        const {new_url, onof, pwd, name} = await folderDetail(item.id)
        return new DownloadTask({
          url: new_url,
          pwd: `${onof}` === '1' ? pwd : undefined,
          urlType: item.type,
          name: name,
          merge: isFile(name),
        })
      }
    })
    await download.addTasks(tasks)
  }, [])

  // 获取分享信息并复制到粘贴板，可选是否包含文件名
  const shareAndWriteClipboard = async (files: Parameters<typeof share>[0], withFileName = true) => {
    const data = await share(files)
    const shareData = data
      .map(value => `${withFileName ? `${value.name} ` : ''}${value.url}${value.pwd ? ` 密码:${value.pwd}` : ''}`)
      .join('\n')
    electron.clipboard.writeText(shareData)
    return shareData
  }

  const [fileDescId, setFileDescId] = useState('')

  // 同步任务
  const [syncVisible, setSyncVisible] = useState(false)

  return (
    <MyScrollView
      onDragEnter={() => {
        if (!uploadMaskVisible) {
          setUploadMaskVisible(true)
        }
      }}
      onDragOver={event => {
        event.preventDefault()
        event.stopPropagation()
      }}
      HeaderComponent={
        <>
          <MyHeader
            right={
              <Input
                allowClear
                placeholder={'搜索当前页面'}
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            }
          >
            <Space>
              <Upload
                multiple
                customRequest={options =>
                  // upload.addTask({folderId: currentFolder.folderid, file: options.file as File})
                  upload.addTasks([new UploadTask({folderId: currentFolder.folderid, file: options.file as File})])
                }
                showUploadList={false}
              >
                <Button icon={<CloudUploadOutlined />}>上传</Button>
              </Upload>
              <Button onClick={() => setVisible(true)}>新建文件夹</Button>

              {!selectedRows.length ? (
                <>
                  <Button
                    type={'primary'}
                    loading={loading['oneClickShare']}
                    title={'复制当前页面的分享链接'}
                    onClick={async () => {
                      await listener(shareAndWriteClipboard(renderList.text), 'oneClickShare')
                      message.success('分享链接已复制!')
                    }}
                  >
                    一键分享
                  </Button>
                  <Button
                    title={'可以将链接文件上传到蓝奏云备份'}
                    type={'primary'}
                    onClick={async () => setSyncVisible(true)}
                  >
                    新建同步任务
                  </Button>
                </>
              ) : (
                <>
                  <Button type={'primary'} onClick={() => setSelectedRows([])}>
                    取消选择
                  </Button>
                  <Button type={'primary'} onClick={() => setAccessVisible(true)}>
                    设置密码
                  </Button>
                  <Button
                    type={'primary'}
                    icon={<MyIcon iconName={'share'} />}
                    loading={loading['oneClickShare']}
                    onClick={async () => {
                      await listener(shareAndWriteClipboard(selectedRows), 'oneClickShare')
                      message.success('分享链接已复制!')
                      setSelectedRows([])
                    }}
                  >
                    分享 ({selectedRows.length})
                  </Button>
                  <Button
                    icon={<MyIcon iconName={'download'} />}
                    type={'primary'}
                    loading={loading['multiDownload']}
                    onClick={async () => {
                      await listener(downloadFile(selectedRows), 'multiDownload')
                      message.success('已经添加到下载列表！')
                      setSelectedRows([])
                    }}
                  >
                    下载 ({selectedRows.length})
                  </Button>
                  <Button
                    title={'时间跟文件数量有关，不建议经常使用'}
                    icon={<MyIcon iconName={'move'} />}
                    type={'primary'}
                    danger={selectedRows.some(value => value.type === URLType.folder)}
                    onClick={() => setMoveInfo({folderId: currentFolder.folderid, rows: selectedRows})}
                  >
                    移动 ({selectedRows.length})
                  </Button>
                  <Button
                    icon={<MyIcon iconName={'delete'} />}
                    type={'primary'}
                    danger
                    loading={loading['deleteFiles']}
                    onClick={() => {
                      Modal.confirm({
                        content: '确认删除？',
                        okText: '删除',
                        okButtonProps: {danger: true},
                        onOk: () => rmFiles(selectedRows, 'deleteFiles'),
                      })
                    }}
                  >
                    删除 ({selectedRows.length})
                  </Button>
                </>
              )}
            </Space>
          </MyHeader>
          <MyBar>
            <Breadcrumb separator={<RightOutlined />}>
              {crumbs.map(value => (
                <Breadcrumb.Item key={value.folderid} href={'#'} onClick={() => lsNextFolder(value.folderid)}>
                  {value.name}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </MyBar>
        </>
      }
    >
      <Table
        pagination={false}
        loading={loading['ls']}
        rowKey={'id'}
        dataSource={renderList.text}
        sticky
        size={'small'}
        onRow={record => ({
          onClick: () => {
            setSelectedRows(prev =>
              prev.some(value => value.id === record.id)
                ? prev.filter(value => value.id !== record.id)
                : [...prev, record]
            )
          },
        })}
        rowSelection={{
          selectedRowKeys: selectedRows.map(value => value.id),
          onSelect: (record, checked) => {
            setSelectedRows(prev => (checked ? [...prev, record] : prev.filter(value => value.id !== record.id)))
          },
          onSelectAll: (checked, selectedRows1, changeRows) => {
            setSelectedRows(prev =>
              checked
                ? [...prev, ...changeRows.filter(value => prev.every(item => item.id !== value.id))]
                : prev.filter(value => changeRows.every(item => item.id !== value.id))
            )
          },
        }}
        columns={[
          {
            title: `文件名${renderList.text?.length ? ` (共${renderList.text?.length}项)` : ''}`,
            sorter: (a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1),
            render: (_, item) => {
              return (
                <Dropdown
                  overlay={
                    <Menu
                      style={{minWidth: 120}}
                      onClick={info => info.domEvent.stopPropagation()}
                      items={[
                        {type: 'group', label: `操作：${item.name}`},
                        {
                          key: '1',
                          label: '移动',
                          onClick: () => setMoveInfo({folderId: currentFolder.folderid, rows: [item]}),
                        },
                        ...(item.type === URLType.file
                          ? [
                              {
                                key: '3',
                                label: '添加描述',
                                onClick: () => setFileDescId(item.id),
                              },
                            ]
                          : []),
                        // {
                        //   key: '2',
                        //   label: '递归下载',
                        // }
                      ]}
                    />
                  }
                  trigger={['contextMenu']}
                >
                  <div className='spaceBetween'>
                    <a
                      href={'#'}
                      {...('folder_des' in item.source ? {title: item.source.folder_des} : {})}
                      onClick={event => {
                        event.stopPropagation()
                        if (item.type === URLType.folder) {
                          lsNextFolder(item.id)
                        }
                      }}
                    >
                      {item.type === URLType.folder ? (
                        <MyIcon iconName={'folder'} />
                      ) : (
                        <MyIcon iconName={item.icon} defaultIcon={'file'} />
                      )}
                      <Space size={3}>
                        {item.name}
                        {`${item.source.onof}` === '1' && <MyIcon iconName={'lock'} gutter={0} />}
                        {`${(item.source as FileInfo).is_des}` === '1' && (
                          <MyIcon iconName={'description'} gutter={0} />
                        )}
                      </Space>
                    </a>
                    <div className='handle' onClick={event => event.stopPropagation()}>
                      <Button
                        title={'编辑'}
                        size={'small'}
                        icon={<MyIcon iconName={'edit'} />}
                        type={'text'}
                        onClick={async () => {
                          if (item.type === URLType.file) {
                            const value = await editFileInfo(item.id)
                            fileForm.setFieldsValue({file_id: item.id, name: value.info})
                            setFileModalVisible(true)
                          } else {
                            const value = await folderDetail(item.id)
                            folderForm.setFieldsValue({folder_id: item.id, name: value.name, folderDesc: value.des})
                            setVisible(true)
                          }
                        }}
                      />
                      <Button
                        title={'分享'}
                        size={'small'}
                        icon={<MyIcon iconName={'share'} />}
                        type={'text'}
                        loading={loading['fileShare']}
                        onClick={async () => {
                          const data = await listener(shareAndWriteClipboard([item], false), 'fileShare')
                          message.success(
                            <span>
                              分享链接已复制：
                              <br />
                              {data}
                            </span>
                          )
                        }}
                      />
                      <Button
                        title={'下载'}
                        size={'small'}
                        icon={<MyIcon iconName={'download'} />}
                        type={'text'}
                        loading={loading['download']}
                        onClick={async () => {
                          await listener(downloadFile([item]), 'download')
                          message.success('已经添加到下载列表！')
                        }}
                      />
                      <Popconfirm
                        title={`确认删除 "${item.name}" ？`}
                        onConfirm={() => rmFiles([item], 'rmFile')}
                        okText='删除'
                        cancelText='取消'
                      >
                        <Button
                          title={'删除'}
                          size={'small'}
                          icon={<MyIcon iconName={'delete'} />}
                          type={'text'}
                          loading={loading['rmFile']}
                        />
                      </Popconfirm>
                    </div>
                  </div>
                </Dropdown>
              )
            },
          },
          {
            title: '大小',
            width: 120,
            sorter: (a, b) => {
              if ('size' in a && 'size' in b) {
                return sizeToByte(a.size) - sizeToByte(b.size)
              }
              return 0
            },
            render: (_, item) => item.size,
          },
          {title: '时间', width: 120, render: (_, item) => ('id' in item ? item.time : '')},
          {title: '下载', width: 120, render: (_, item) => ('id' in item ? item.downs : '')},
        ]}
      />

      {/*创建 / 修改 文件夹*/}
      <Modal
        title={folderForm.getFieldValue('folder_id') ? '编辑文件夹' : '新建文件夹'}
        visible={visible}
        onCancel={() => setVisible(false)}
        onOk={() => folderForm.submit()}
        afterClose={() => folderForm.resetFields()}
        confirmLoading={loading['saveDir']}
        destroyOnClose
      >
        <Form
          form={folderForm}
          layout={'vertical'}
          onFinish={async () => {
            const form: AsyncReturnType<typeof folderForm.validateFields> = folderForm.getFieldsValue(true)
            if (form.folder_id) {
              const value = await listener(editFolder(form.folder_id, form.name, form.folderDesc), 'saveDir')
              message.success(value.info)
            } else {
              await listener(
                mkdir({parentId: currentFolder.folderid, name: form.name, description: form.folderDesc}),
                'saveDir'
              )
              message.success('创建成功')
            }

            setVisible(false)
            listFile(currentFolder.folderid)
          }}
        >
          <Form.Item label={'文件名'} name={'name'} rules={[{required: true}]}>
            <Input autoFocus placeholder={'不能包含特殊字符，如：空格，括号'} />
          </Form.Item>
          <Form.Item label={'文件描述'} name={'folderDesc'}>
            <Input.TextArea placeholder={'可选项，建议160字数以内。'} maxLength={160} showCount rows={5} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={'编辑文件'}
        visible={fileModalVisible}
        onCancel={() => setFileModalVisible(false)}
        okText={'保存'}
        confirmLoading={loading['saveFile']}
        onOk={() => fileForm.submit()}
        afterClose={() => fileForm.resetFields()}
        destroyOnClose
      >
        <Form
          form={fileForm}
          layout={'vertical'}
          onFinish={async () => {
            const values: AsyncReturnType<typeof fileForm.validateFields> = fileForm.getFieldsValue(true)

            if (!values.name) return message.error('请输入文件名')
            await listener(editFile(values.file_id, values.name), 'saveFile')
            setFileModalVisible(false)
            listFile(currentFolder.folderid)
          }}
        >
          <Form.Item label={'文件名'} name={'name'} rules={[{required: true}]}>
            <Input autoFocus placeholder={'不能包含特殊字符，如：空格，括号'} />
          </Form.Item>
        </Form>
      </Modal>

      <SelectFolderModal
        currentFolder={moveInfo?.folderId}
        onCancel={() => setMoveInfo(null)}
        onOk={async (folderId, level) => {
          await listenerFn(async () => {
            try {
              const result = await mv(moveInfo.rows, folderId, level)
              const [fileCount, folderCount] = countTree(result)
              const dismiss = message.success(
                <span>
                  成功！移动文件：{fileCount}, 文件夹：{folderCount}
                  <Button
                    type={'link'}
                    size={'small'}
                    onClick={() => {
                      dismiss()
                      lsNextFolder(folderId)
                    }}
                  >
                    打开目录
                  </Button>
                </span>
              )
              setMoveInfo(null)
              setSelectedRows([])
              listFile(currentFolder.folderid)
            } catch (e: any) {
              message.error(e.message)
            }
          }, 'move')
        }}
      />

      <SetAccessModal
        visible={accessVisible}
        rows={selectedRows}
        onCancel={() => setAccessVisible(false)}
        onOk={async rows => {
          const failTimes = await setAccess(
            rows.map(value => ({
              id: value.id,
              type: value.type,
              shows: value.shows,
              shownames: value.shownames,
            }))
          )
          message.open({
            content: `成功：${selectedRows.length - failTimes}，失败：${failTimes}`,
            type: selectedRows.length === failTimes ? 'error' : failTimes ? 'warning' : 'success',
          })
          setSelectedRows([])
          setAccessVisible(false)
        }}
      />

      <FileDescModal
        fileId={fileDescId}
        onCancel={() => setFileDescId('')}
        onOk={() => {
          setFileDescId('')
          listFile(currentFolder.folderid)
        }}
      />

      {/*上传遮罩*/}
      {uploadMaskVisible && (
        <div className='upload'>
          <MyIcon iconName={'empty'} className='uploadIcon' />
          {`上传到: ${currentFolder.name}`}
          <div
            className='uploadMask'
            onDragLeave={() => setUploadMaskVisible(false)}
            onDragOver={event => {
              event.preventDefault()
              event.stopPropagation()
            }}
            onDrop={async event => {
              setUploadMaskVisible(false)

              if (event.dataTransfer.files.length) {
                await upload.addTasks(
                  Array.from(event.dataTransfer.files).map(
                    file => new UploadTask({folderId: currentFolder.folderid, file})
                  )
                )
                message.success('上传中...')
              }
            }}
          />
        </div>
      )}

      <SyncModal
        visible={syncVisible}
        onCancel={() => setSyncVisible(false)}
        onOk={async data => {
          const dir = await getDownloadDir()
          await sync.addTask(
            new SyncTask({
              folderId: currentFolder.folderid,
              trashOnFinish: data.trashOnFinish,
              download:
                data.type === '1'
                  ? new DownloadLinkTask({url: data.url, dir, urlType: URLType.file})
                  : new DownloadTask({url: data.url, pwd: data.pwd, dir}),
            })
          )
          console.log('任务已添加')

          setSyncVisible(false)
        }}
      />
    </MyScrollView>
  )
}

interface SyncForm {
  type: string
  url: string
  pwd: string
  trashOnFinish: boolean
}

interface SyncModalProps {
  visible: boolean
  onOk: (data: SyncForm) => void
  onCancel: () => void
}

const linkRules: Rule[] = [
  {required: true, message: '链接不能为空'},
  {pattern: /^https?:\/\/.+/, message: '链接格式不正确'},
]

function SyncModal(props: SyncModalProps) {
  const [form] = Form.useForm<SyncForm>()

  return (
    <Modal
      visible={props.visible}
      title={'新建同步任务'}
      width={650}
      onCancel={props.onCancel}
      onOk={() => form.submit()}
      afterClose={() => form.resetFields()}
      destroyOnClose
    >
      <Form
        form={form}
        labelCol={{flex: '95px'}}
        initialValues={{type: '1', trashOnFinish: true}}
        onFinish={() => props.onOk(form.getFieldsValue(true))}
      >
        <Form.Item label='任务类型' name={'type'}>
          <Radio.Group onChange={() => form.setFieldsValue({url: '', pwd: ''})}>
            <Radio.Button value='1'>直链</Radio.Button>
            {/*如果是蓝奏云，有极速同步选项。其他链接一般有时效性，所以没必要记录*/}
            <Radio.Button value='2'>蓝奏云</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(prevValues, nextValues) => prevValues.type !== nextValues.type}>
          {() => {
            switch (form.getFieldValue('type')) {
              case '1':
                return (
                  <Form.Item label={'URL'} name={'url'} rules={linkRules}>
                    <Input autoFocus placeholder={'直链链接'} />
                  </Form.Item>
                )
              case '2':
                return (
                  <Form.Item label={'URL'} required>
                    <Row gutter={12}>
                      <Col flex={1}>
                        <Form.Item noStyle name={'url'} rules={linkRules}>
                          <Input
                            autoFocus
                            placeholder={'蓝奏云链接'}
                            onPaste={async event => {
                              const parsed = parseShare(event.clipboardData.getData('text/plain'))
                              if (parsed) {
                                await delay(16)
                                form.setFieldsValue({url: parsed.url, pwd: parsed.pwd})
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col flex={'160px'}>
                        <Form.Item noStyle name={'pwd'}>
                          <Input placeholder={'密码（可选）'} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form.Item>
                )
            }
          }}
        </Form.Item>
        <Form.Item
          label={' '}
          colon={false}
          name={'trashOnFinish'}
          valuePropName={'checked'}
          getValueProps={value => ({checked: value})}
          getValueFromEvent={e => e.target.checked}
        >
          <Checkbox>任务完成后，下载文件放入回收站</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  )
}

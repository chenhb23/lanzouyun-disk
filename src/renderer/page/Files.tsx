import React, {useCallback, useEffect, useMemo, useState} from 'react'
import electron from 'electron'
import {Header} from '../component/Header'
import {Button} from '../component/Button'
import {message} from '../component/Message'
import {Crumbs} from '../component/Crumbs'
import {Icon} from '../component/Icon'
import {isFile, sizeToByte} from '../../common/util'
import {rm} from '../../common/core/rm'
import {ls, lsDir, LsFiles, URLType} from '../../common/core/ls'
import {Bar} from '../component/Bar'
import {useLoading} from '../hook/useLoading'
import {ScrollView} from '../component/ScrollView'
import {Input, Textarea} from '../component/Input'
import {Modal} from '../component/Modal'
import {mkdir} from '../../common/core/mkdir'
import {download, upload} from '../store'
import {fileDetail, folderDetail} from '../../common/core/detail'
import Table from '../component/Table'
import {editFile, editFileInfo, editFolder, editFolderInfo} from '../../common/core/edit'
import {countTree, mv} from '../../common/core/mv'
import {ChooseFile} from '../component/ChooseFile'

import './Files.css'

interface FolderForm {
  folder_id?: FolderId // 如果有 folder_id 则是编辑
  name: string
  folderDesc: string
}

// const getRowKey = (record: AsyncReturnType<typeof ls>['text'][number]) =>
//   `${'id' in record ? record.id : record.id}`

export default function Files() {
  const [visible, setVisible] = useState(false)
  const {loading, listener, listenerFn} = useLoading()
  const [form, setForm] = useState({} as FolderForm)
  const [fileForm, setFileForm] = useState({} as {file_id: FileId; name: string})

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

  const currentFolder = crumbs[crumbs.length - 1].folderid

  const listFile = useCallback(
    async folder_id => {
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
    listFile(currentFolder)
  }

  useEffect(() => {
    listFile(-1)
  }, [listFile])

  useEffect(() => {
    const refresh = () => listFile(currentFolder)
    upload.on('finish', refresh)
    return () => {
      upload.removeListener('finish', refresh)
    }
  }, [currentFolder, listFile])

  function cancel() {
    setVisible(false)
    setForm({} as FolderForm)
  }

  // 创建 / 修改 文件夹
  async function saveDir() {
    if (form.folder_id) {
      const value = await listener(editFolder(form.folder_id, form.name, form.folderDesc), 'saveDir')
      message.success(value.info)
    } else {
      await listener(mkdir({parentId: currentFolder, name: form.name, description: form.folderDesc}), 'saveDir')
      message.success('创建成功')
    }

    cancel()
    listFile(currentFolder)
  }

  const [selectedRows, setSelectedRows] = useState<AsyncReturnType<typeof ls>['text']>([])

  const [moveFolderId, setMoveFolderId] = useState<FolderId>('')

  const downloadFile = useCallback(
    async (item: LsFiles) => {
      await listenerFn(async () => {
        if (item.type === URLType.file) {
          const {f_id, is_newd, pwd, onof} = await fileDetail(item.id)
          await download.addTask({
            url: `${is_newd}/${f_id}`,
            pwd: `${onof}` === '1' ? pwd : undefined,
            name: item.name,
            merge: false,
          })
        } else {
          const {new_url, onof, pwd, name} = await folderDetail(item.id)
          await download.addTask({
            name: name,
            url: new_url,
            pwd: `${onof}` === '1' ? pwd : undefined,
            merge: isFile(name),
          })
        }
      }, 'download')
    },
    [listenerFn]
  )

  return (
    <ScrollView
      onDragEnter={() => {
        message.destroy()
        message.info('放开上传')
      }}
      onDragOver={event => {
        event.preventDefault()
        event.stopPropagation()
      }}
      onDrop={async event => {
        message.destroy()
        message.success('上传中...')
        for (const file of event.dataTransfer.files) {
          await upload.addTask({folderId: currentFolder, file})
        }
      }}
      HeaderComponent={
        <>
          <Header
            right={
              <div className='Search'>
                <Input placeholder={'搜索当前页面'} value={search} onChange={event => setSearch(event.target.value)} />
                {!!search && <Icon iconName={'clear'} className='SearchIcon' onClick={() => setSearch('')} />}
              </div>
            }
          >
            <ChooseFile
              multiple
              onChange={async event => {
                for (const file of event.target.files) {
                  await upload.addTask({folderId: currentFolder, file})
                }
              }}
            >
              <Button icon={<Icon iconName={'upload'} />}>上传</Button>
            </ChooseFile>
            <Button
              type={'primary'}
              onClick={() => {
                setVisible(true)
              }}
            >
              新建文件夹
            </Button>
            {!!selectedRows.length && (
              <>
                <Button type={'primary'} onClick={() => setSelectedRows([])}>
                  取消选择
                </Button>
                <Button
                  icon={<Icon iconName={'download'} />}
                  type={'primary'}
                  onClick={async () => {
                    for (const item of selectedRows) {
                      await downloadFile(item)
                    }
                    message.success('已经添加到下载列表！')
                    setSelectedRows([])
                  }}
                >
                  下载 ({selectedRows.length})
                </Button>
                <Button
                  title={'时间跟文件数量有关，不建议经常使用'}
                  icon={<Icon iconName={'move'} />}
                  type={selectedRows.some(value => value.type === URLType.folder) ? 'danger' : 'primary'}
                  onClick={() => setMoveFolderId(currentFolder)}
                >
                  移动 ({selectedRows.length})
                </Button>
                <Button
                  icon={<Icon iconName={'delete'} />}
                  type={'danger'}
                  loading={loading['deleteFiles']}
                  onClick={() => {
                    const result = confirm('确认删除？')
                    if (result) {
                      rmFiles(selectedRows, 'deleteFiles')
                    }
                  }}
                >
                  删除 ({selectedRows.length})
                </Button>
              </>
            )}
          </Header>
          <Bar style={{justifyContent: 'flex-start'}}>
            <Crumbs crumbs={crumbs} onClick={folderId => lsNextFolder(folderId)} />
            {(loading['ls'] || loading['download']) && <Icon iconName={'loading'} />}
          </Bar>
        </>
      }
    >
      <Table
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
        rowKey={'id'}
        dataSource={renderList.text}
        columns={[
          {
            title: `文件名${renderList.text?.length ? ` (共${renderList.text?.length}项)` : ''}`,
            sorter: (a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1),
            render: item => {
              return (
                <div className='table-file'>
                  <a
                    href={'#'}
                    title={item.name}
                    onClick={event => {
                      event.stopPropagation()
                      if (item.type === URLType.folder) {
                        lsNextFolder(item.id)
                      }
                    }}
                  >
                    {item.type === URLType.folder ? (
                      <Icon iconName={'folder'} />
                    ) : (
                      <Icon iconName={item.icon} defaultIcon={'file'} />
                    )}
                    {item.name}
                    {`${item.source.onof}` === '1' && <Icon iconName={'lock'} style={{marginLeft: 5}} />}
                  </a>
                  <div className='handle' onClick={event => event.stopPropagation()}>
                    <Button
                      title={'编辑'}
                      type={'icon'}
                      icon={'edit'}
                      onClick={async () => {
                        if (item.type === URLType.file) {
                          const value = await editFileInfo(item.id)
                          setFileForm({file_id: item.id, name: value.info})
                        } else {
                          const value = await editFolderInfo(item.id)
                          setForm({
                            folder_id: item.id,
                            name: value.info.name,
                            folderDesc: value.info.des,
                          })
                          setVisible(true)
                        }
                      }}
                    />
                    <Button
                      title={'分享'}
                      icon={'share'}
                      type={'icon'}
                      loading={loading['fileDetail']}
                      onClick={async () => {
                        let shareUrl = ''
                        if (item.type === URLType.file) {
                          const info = await listener(fileDetail(item.id), 'fileDetail')
                          shareUrl = `${info.is_newd}/${info.f_id}${info.onof === '1' ? `\n密码:${info.pwd}` : ''}`
                        } else {
                          const info = await listener(folderDetail(item.id), 'fileDetail')
                          shareUrl = `${info.new_url}${info.onof === '1' ? `\n密码:${info.pwd}` : ''}`
                        }
                        electron.clipboard.writeText(shareUrl)
                        message.success(`分享链接已复制：\n${shareUrl}`)
                      }}
                    />
                    <Button
                      title={'下载'}
                      icon={'download'}
                      type={'icon'}
                      loading={loading['download']}
                      onClick={() => downloadFile(item)}
                    />
                    <Button
                      title={'删除'}
                      icon={'delete'}
                      type={'icon'}
                      loading={loading['rmFile']}
                      onClick={() => rmFiles([item], 'rmFile')}
                    />
                  </div>
                </div>
              )
            },
          },
          {
            title: '大小',
            sorter: (a, b) => {
              if ('size' in a && 'size' in b) {
                return sizeToByte(a.size) - sizeToByte(b.size)
              }
              return 0
            },
            render: item => ('id' in item ? item.size : '-'),
          },
          {title: '时间', render: item => ('id' in item ? item.time : '')},
          {title: '下载', render: item => ('id' in item ? item.downs : '')},
        ]}
      />
      <Modal
        title={form.folder_id ? '编辑文件夹' : '新建文件夹'}
        visible={visible}
        onCancel={cancel}
        onOk={saveDir}
        okButtonProps={{loading: loading['saveDir']}}
      >
        <h4>文件名</h4>
        <Input
          value={form.name}
          placeholder={'不能包含特殊字符，如：空格，括号'}
          onChange={event => setForm(prevState => ({...prevState, name: event.target.value}))}
        />
        <h4>文件描述</h4>
        <Textarea
          value={form.folderDesc}
          placeholder={'可选项，建议160字数以内。'}
          maxLength={160}
          onChange={event => setForm(prevState => ({...prevState, folderDesc: event.target.value}))}
        />
      </Modal>
      <Modal
        title={'编辑文件'}
        visible={!!fileForm.file_id}
        onCancel={() => setFileForm({} as typeof fileForm)}
        okText={'保存'}
        okButtonProps={{loading: loading['saveFile']}}
        onOk={async () => {
          if (!fileForm.name) return message.error('请输入文件名')
          await listener(editFile(fileForm.file_id, fileForm.name), 'saveFile')
          setFileForm({} as typeof fileForm)
          listFile(currentFolder)
        }}
      >
        <div>
          <h4>文件名</h4>
          <Input
            value={fileForm.name}
            placeholder={'不能包含特殊字符，如：空格，括号'}
            onChange={event => setFileForm(prevState => ({...prevState, name: event.target.value}))}
          />
        </div>
      </Modal>

      <SelectDir
        currentFolder={moveFolderId}
        loading={loading['move']}
        onCancel={() => setMoveFolderId('')}
        onOk={async (folderId, level) => {
          await listenerFn(async () => {
            try {
              message.success('正在移动')
              const result = await mv(selectedRows, folderId, level)
              const [fileCount, folderCount] = countTree(result)
              message.success(`成功！移动文件：${fileCount}, 文件夹：${folderCount}`)
              setMoveFolderId('')
              setSelectedRows([])
              listFile(currentFolder)
            } catch (e: any) {
              message.error(e)
            }
          }, 'move')
        }}
      />
    </ScrollView>
  )
}

interface SelectDirProps {
  currentFolder: FolderId
  onCancel?: () => void
  onOk: (folderId: FolderId, level: number) => void
  loading?: boolean
}

function SelectDir(props: SelectDirProps) {
  const [data, setData] = useState<AsyncReturnType<typeof lsDir>>(null)
  const crumbs = useMemo(() => [{name: '全部文件', folderid: -1}, ...(data?.info || [])], [data?.info])
  const current = crumbs[crumbs.length - 1]

  const ls = useCallback(async (id = -1) => {
    const dirs = await lsDir(id)
    setData(dirs)
  }, [])

  const visible = !!props.currentFolder

  useEffect(() => {
    if (visible) {
      ls('-1')
    }
  }, [ls, visible])

  const moveDisabled = props.currentFolder === current.folderid

  return (
    <Modal
      visible={visible}
      title={'选择文件夹'}
      okButtonProps={{
        style: {maxWidth: 150, textOverflow: 'ellipsis', overflow: 'hidden'},
        loading: props.loading,
        disabled: moveDisabled,
      }}
      okText={moveDisabled ? '无需移动' : `移动到：${current.name}`}
      onCancel={props.onCancel}
      onOk={() => props.onOk(current.folderid, crumbs.length - 1)}
      bodyStyle={{minHeight: 200}}
    >
      <Crumbs crumbs={crumbs} onClick={folderid => ls(folderid)} />
      <Table
        dataSource={data?.text}
        onRow={record => ({
          onClick: () => ls(record.fol_id),
        })}
        columns={[
          {
            title: '文件夹',
            render: record => {
              return (
                <>
                  <Icon iconName={'folder'} />
                  <a href={'#'}>{record.name}</a>
                </>
              )
            },
          },
        ]}
        rowKey={'fol_id'}
      />
    </Modal>
  )
}

import React, {useCallback, useEffect, useMemo, useState} from 'react'
import electron from 'electron'
import {Header} from '../component/Header'
import {Button} from '../component/Button'
import {message} from '../component/Message'
import {Crumbs} from '../component/Crumbs'
import {Icon} from '../component/Icon'
import {isFile, sizeToByte} from '../../common/util'
import {rmFile, rmFolder} from '../../common/core/rm'
import {ls, LsFiles, URLType} from '../../common/core/ls'
import {Bar} from '../component/Bar'
import {useLoading} from '../hook/useLoading'
import {ScrollView} from '../component/ScrollView'
import {Input, Textarea} from '../component/Input'
import {Modal} from '../component/Modal'
import {mkdir} from '../../common/core/mkdir'
import {download, upload} from '../store'
import {fileDetail, folderDetail} from '../../common/core/detail'

import './Files.css'
import Table from '../component/Table'
import {editFile, editFileInfo, editFolder, editFolderInfo} from '../../common/core/edit'

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

  const currentFolder = useMemo(() => list.info?.find(item => item.now === 1)?.folderid || -1, [list])

  const listFile = useCallback(folder_id => listener(ls(folder_id), 'ls').then(value => setList(value)), [listener])

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
      await listener(mkdir(currentFolder, form.name, form.folderDesc), 'saveDir')
      message.success('创建成功')
    }

    cancel()
    listFile(currentFolder)
  }

  const [selectedRows, setSelectedRows] = useState<AsyncReturnType<typeof ls>['text']>([])
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
      onDrop={event => {
        message.destroy()
        message.success('上传中...')
        Array.prototype.map.call(event.dataTransfer.files, (file: File) => {
          upload.addTask({folderId: currentFolder, file})
        })
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
            <Button
              icon={'upload'}
              file
              onChange={files => {
                Array.prototype.map.call(files, (file: File) => {
                  upload.addTask({folderId: currentFolder, file})
                })
              }}
            >
              上传
            </Button>
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
                  type={'primary'}
                  onClick={async () => {
                    for (const item of selectedRows) {
                      await downloadFile(item)
                    }
                    message.success('已经添加到下载列表！')
                    setSelectedRows([])
                  }}
                >
                  下载所选 ({selectedRows.length} 项)
                </Button>
              </>
            )}
          </Header>
          <Bar>
            <Crumbs
              crumbs={[{name: '全部文件', folderid: -1}, ...(list.info || [])]}
              onClick={folderid => listFile(folderid).then(() => setSearch(''))}
            />
            {(loading['ls'] || loading['download']) && <Icon iconName={'loading'} />}
          </Bar>
        </>
      }
    >
      <Table
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
                  <span>
                    {item.type === URLType.folder ? (
                      <Icon iconName={'folder'} />
                    ) : (
                      <Icon iconName={item.icon} defaultIcon={'file'} />
                    )}

                    <span
                      title={item.name}
                      onClick={() => {
                        if (item.type === URLType.folder) {
                          listFile(item.id).then(() => setSearch(''))
                        }
                      }}
                    >
                      {item.name}
                      {`${item.source.onof}` === '1' && <Icon iconName={'lock'} style={{marginLeft: 5}} />}
                    </span>
                  </span>
                  <div className='handle'>
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
                      onClick={async () => {
                        if (item.type === URLType.file) {
                          await listener(rmFile(item.id), 'rmFile')
                        } else {
                          await listener(rmFolder(item.id), 'rmFile')
                        }
                        message.success('已删除')
                        setSelectedRows(prev => prev.filter(value => value.id !== item.id))
                        listFile(currentFolder)
                      }}
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

      <Modal visible={visible} onCancel={cancel}>
        <div className='dialog'>
          <div style={{width: 400}}>
            <h3>文件名</h3>
            <Input
              value={form.name}
              placeholder={'不能包含特殊字符，如：空格，括号'}
              onChange={event => setForm(prevState => ({...prevState, name: event.target.value}))}
            />
            <h3>文件描述</h3>
            <Textarea
              value={form.folderDesc}
              placeholder={'可选项，建议160字数以内。'}
              maxLength={160}
              onChange={event => setForm(prevState => ({...prevState, folderDesc: event.target.value}))}
            />
            <div style={{textAlign: 'right', marginTop: 10}}>
              <Button onClick={cancel}>取消</Button>
              <Button loading={loading['saveDir']} type={'primary'} onClick={saveDir}>
                保存
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal visible={!!fileForm.file_id} onCancel={() => setFileForm({} as typeof fileForm)}>
        <div className='dialog'>
          <div style={{width: 400}}>
            <h3>文件名</h3>
            <Input
              value={fileForm.name}
              placeholder={'不能包含特殊字符，如：空格，括号'}
              onChange={event => setFileForm(prevState => ({...prevState, name: event.target.value}))}
            />
            <div style={{textAlign: 'right', marginTop: 10}}>
              <Button onClick={() => setFileForm({} as typeof fileForm)}>取消</Button>
              <Button
                loading={loading['saveFile']}
                type={'primary'}
                onClick={async () => {
                  if (!fileForm.name) return message.error('请输入文件名')
                  await listener(editFile(fileForm.file_id, fileForm.name), 'saveFile')
                  setFileForm({} as typeof fileForm)
                  listFile(currentFolder)
                }}
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </ScrollView>
  )
}

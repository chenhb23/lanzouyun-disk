import React, {useCallback, useEffect, useMemo, useState} from 'react'
import electron from 'electron'
import {Header} from '../component/Header'
import {Button} from '../component/Button'
import {message} from '../component/Message'
import {Crumbs} from '../component/Crumbs'
import {Table, Tr} from '../component/Table'
import {Icon} from '../component/Icon'
import {isFile} from '../../common/util'
import {rmFile, rmFolder} from '../../common/core/rm'
import {ls} from '../../common/core/ls'
import {Bar} from '../component/Bar'
import {useLoading} from '../hook/useLoading'
import {ScrollView} from '../component/ScrollView'
import {Input, Textarea} from '../component/Input'
import {Modal} from '../component/Modal'
import {mkdir} from '../../common/core/mkdir'
import {download, upload} from '../store'
import {fileDetail, folderDetail} from '../../common/core/detail'

import './Files.css'

interface FolderForm {
  name: string
  folderDesc: string
}

export default function Files() {
  const [visible, setVisible] = useState(false)
  const {loading, listener} = useLoading()
  const [form, setForm] = useState({} as FolderForm)

  const [list, setList] = useState({text: [], info: []} as AsyncReturnType<typeof ls>)
  const [search, setSearch] = useState('')
  const renderList = useMemo(
    () =>
      search
        ? {
            ...list,
            text: list.text?.filter(item => {
              const name = ('id' in item ? item.name_all : item.name).toLowerCase()
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

  async function makeDir() {
    await listener(mkdir(currentFolder, form.name, form.folderDesc), 'mkdir')
    message.success('创建成功')
    cancel()
    listFile(currentFolder)
  }

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
        header={[`文件名${renderList.text?.length ? ` (共${renderList.text?.length}项)` : ''}`, '大小', '时间', '下载']}
      >
        {renderList.text?.map(item => {
          const size = 'id' in item ? item.size : '-'
          const time = 'id' in item ? item.time : ''
          const downs = 'id' in item ? item.downs : ''
          const id = 'id' in item ? item.id : item.fol_id

          return (
            <Tr key={id}>
              <td className='table-file'>
                {'id' in item ? (
                  // 文件
                  <>
                    <Icon iconName={'file'} />
                    <span title={item.name_all}>{item.name_all}</span>
                    <div className='handle'>
                      <Button
                        icon={'share'}
                        type={'icon'}
                        loading={loading['fileDetail']}
                        onClick={async () => {
                          const info = await listener(fileDetail(item.id), 'fileDetail')
                          const shareUrl = `${info.is_newd}/${info.f_id}${
                            info.onof === '1' ? `\n密码: ${info.pwd}` : ''
                          }`
                          electron.clipboard.writeText(shareUrl)
                          message.success(`分享链接已复制：\n${shareUrl}`)
                        }}
                      />
                      <Button
                        icon={'download'}
                        type={'icon'}
                        loading={loading['download']}
                        onClick={async () => {
                          /*
                          const {f_id, is_newd, pwd, onof} = await fileDetail(item.id)
                          const url = `${is_newd}/${f_id}`
                          const password = onof == '1' ? pwd : undefined
                          await download.addFiTask({
                            url,
                            name: item.name,
                            size: item.size,
                            pwd: password,
                          })
                          */

                          // todo: 1.监听函数改造; 2.loading
                          const {f_id, is_newd, pwd, onof} = await fileDetail(item.id)
                          await download.addTask({
                            url: `${is_newd}/${f_id}`,
                            pwd: `${onof}` === '1' ? pwd : undefined,
                            name: item.name,
                            merge: false,
                          })
                        }}
                      />
                      <Button
                        icon={'delete'}
                        type={'icon'}
                        loading={loading['rmFile']}
                        onClick={async () => {
                          const {zt, info} = await listener(rmFile(id), 'rmFile')
                          if (zt !== 1) return message.error(info)
                          message.success('已删除')
                          listFile(currentFolder)
                        }}
                      />
                    </div>
                  </>
                ) : (
                  // 文件夹
                  <>
                    <Icon iconName='folder' />
                    <span title={item.name} onClick={() => listFile(item.fol_id).then(() => setSearch(''))}>
                      {item.name}
                    </span>
                    <div className='handle'>
                      <Button
                        icon={'share'}
                        type={'icon'}
                        loading={loading['folderDetail']}
                        onClick={async () => {
                          const info = await listener(folderDetail(item.fol_id), 'folderDetail')
                          const shareUrl = `${info.new_url}${info.onof === '1' ? `\n密码: ${info.pwd}` : ''}`
                          electron.clipboard.writeText(shareUrl)
                          message.success(`分享链接已复制：\n${shareUrl}`)
                        }}
                      />
                      <Button
                        icon={'download'}
                        type={'icon'}
                        loading={loading['addFolderTask']}
                        onClick={async () => {
                          // listener(download.addFolderTask({folder_id: item.fol_id}), 'addFolderTask')

                          const {new_url, onof, pwd, name} = await folderDetail(item.fol_id)
                          await download.addTask({
                            name: name,
                            url: new_url,
                            pwd: `${onof}` === '1' ? pwd : undefined,
                            merge: isFile(name),
                          })
                        }}
                      />
                      <Button
                        icon={'delete'}
                        type={'icon'}
                        loading={loading['rmFolder']}
                        onClick={async () => {
                          const {zt, info} = await listener(rmFolder(item.fol_id), 'rmFolder')
                          if (zt !== 1) return message.error(info)
                          message.success('已删除')
                          listFile(currentFolder)
                        }}
                      />
                    </div>
                  </>
                )}
              </td>
              <td>{size}</td>
              <td>{time}</td>
              <td>{downs}</td>
              <td />
            </Tr>
          )
        })}
      </Table>

      <Modal visible={visible}>
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
              <Button loading={loading['mkdir']} type={'primary'} onClick={makeDir}>
                保存
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </ScrollView>
  )
}

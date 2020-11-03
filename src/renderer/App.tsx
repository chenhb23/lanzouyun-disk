import React, {useEffect, useMemo, useRef, useState} from 'react'
import './App.css'
import {ls, lsDir} from '../common/core/ls'
import {byteToSize, isFile} from '../common/util'
import {uploadManager} from '../common/manager/UploadManager'
import Footer from './Footer'
import {downloadManager} from '../common/manager/DownloadManager'
import {Dragarea} from './Dragarea'
import {Icon} from './component/Icon'
import {Menu, MenuItem, MenuProvider} from './component/Menu'
import {TabPane, Tabs} from './component/Tabs'
import {Split, Table} from './component/Table'
import {Header} from './component/Header'
import {Button} from './component/Button'
import {Crumbs} from './component/Crumbs'
import {Upload} from './Upload'
import {observer} from 'mobx-react'
import {Modal} from './component/Modal'
import {Input, Textarea} from './component/Input'
import {mkdir} from '../common/core/mkdir'
import {message} from './component/Message'
import {getFileDetail} from '../common/core/download'
import requireModule from '../common/requireModule'
import {rm} from '../common/core/rm'
const electron = requireModule('electron')

type List = AsyncReturnType<typeof ls>

interface FolderForm {
  name: string
  folderDesc: string
}

const App = observer(() => {
  const [test, setTest] = useState(false)

  const [menu, setMenu] = useState('')

  const [list, setList] = useState({} as List)
  const currentFolder = useMemo(() => list.info?.find(item => item.now === 1)?.folderid || -1, [list])

  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState({} as FolderForm)

  function cancel() {
    setVisible(false)
    setForm({} as FolderForm)
  }

  async function makeDir() {
    await mkdir(currentFolder, form.name, form.folderDesc)
    message.success('创建成功')
    cancel()
    listFile(currentFolder)
  }

  useEffect(function () {
    listFile(-1)
  }, [])

  function listFile(folder_id) {
    ls(folder_id).then(value => setList(value))
  }

  function taskLength(tasks) {
    const len = Object.keys(tasks).length
    return len ? `（${len}）` : ''
  }

  return (
    <div className='App'>
      <main className='main'>
        <aside className='aside'>
          <MenuProvider defaultKey={'1'} onChange={key => setMenu(key)}>
            <Menu>
              <MenuItem id={'1'} icon={'file'}>
                全部文件
              </MenuItem>
            </Menu>
            <Menu title={'传输列表'}>
              <MenuItem id={'2'} icon={'upload'}>
                正在上传 {taskLength(uploadManager.tasks)}
              </MenuItem>
              <MenuItem id={'3'} icon={'download'}>
                正在下载 {taskLength(downloadManager.tasks)}
              </MenuItem>
              <MenuItem id={'4'} icon={'finish'}>
                已完成
              </MenuItem>
            </Menu>
            <Menu title={'工具列表'}>
              <MenuItem id={'5'} icon={'upload'}>
                解析Url
              </MenuItem>
              <MenuItem id={'6'} icon={'download'}>
                文件分割
              </MenuItem>
            </Menu>
          </MenuProvider>
        </aside>
        <div className='content'>
          <Tabs activeKey={menu}>
            <TabPane
              id={'1'}
              panetop={
                <>
                  <Header>
                    <Button
                      icon={'upload'}
                      file
                      onChange={files => {
                        const file = files[0]
                        uploadManager.addTask({
                          fileName: file.name,
                          filePath: file.path,
                          folderId: currentFolder,
                          size: file.size,
                          type: file.type,
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
                    <Button
                      onClick={() => {
                        setTest(prevState => !prevState)
                        if (test) {
                          const dis = message.success('adsf')
                          setTimeout(() => {
                            dis()
                          }, 600)
                        } else {
                          message.info('adsf')
                        }
                      }}
                    >
                      测试
                    </Button>
                  </Header>
                  <Bar>
                    <Crumbs
                      crumbs={[{name: '全部文件', folderid: -1}, ...(list.info || [])]}
                      onClick={folderid => listFile(folderid)}
                    />
                  </Bar>
                </>
              }
              onDragOver={event => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onDrop={event => {
                const file = event.dataTransfer.files[0]
                uploadManager.addTask({
                  fileName: file.name,
                  filePath: file.path,
                  folderId: currentFolder,
                  size: file.size,
                  type: file.type,
                })
              }}
            >
              <Table header={['文件名', '大小', '时间', '下载']}>
                {list.text?.map(item => {
                  const size = 'id' in item ? item.size : '-'
                  const time = 'id' in item ? item.time : ''
                  const downs = 'id' in item ? item.downs : ''
                  const id = 'id' in item ? item.id : item.fol_id
                  const fileName = 'id' in item ? item.name_all : item.name

                  return (
                    <tr key={id}>
                      <td>
                        {'id' in item ? (
                          <>
                            <Icon iconName={'file'} />
                            <span>{item.name_all}</span>
                          </>
                        ) : (
                          <>
                            <Icon iconName='folder' />
                            <span onClick={() => listFile(item.fol_id)}>{item.name}</span>
                          </>
                        )}
                        <div className='handle'>
                          {'id' in item && (
                            <Icon
                              iconName={'share'}
                              onClick={async () => {
                                const info = await getFileDetail(item.id)
                                const shareUrl = `${info.is_newd}/${info.f_id}`
                                // todo: 分享文件夹
                                electron.clipboard.writeText(shareUrl)
                                message.success(`分享链接已复制：\n${shareUrl}`)
                              }}
                            />
                          )}
                          {isFile(item.name) && (
                            <Icon
                              iconName={'download'}
                              onClick={() =>
                                downloadManager.addTask({
                                  id,
                                  fileName,
                                  isFile: 'id' in item,
                                })
                              }
                            />
                          )}
                          <Icon
                            iconName={'delete'}
                            onClick={async () => {
                              const {zt, info} = await rm(id, 'id' in item)
                              if (zt === 1) {
                                message.success('已删除')
                                listFile(currentFolder)
                              } else {
                                message.info(info)
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td>{size}</td>
                      <td>{time}</td>
                      <td>{downs}</td>
                      <td></td>
                    </tr>
                  )
                })}
              </Table>
            </TabPane>
            <TabPane
              id={'2'}
              panetop={
                <>
                  <Header>
                    <Button>全部暂停</Button>
                    <Button>全部开始</Button>
                    <Button>全部删除</Button>
                  </Header>
                  <Bar>
                    <span>正在上传</span>
                  </Bar>
                </>
              }
            >
              <Table header={['文件名', '大小', '操作']}>
                {Object.keys(uploadManager.tasks).map(key => {
                  const item = uploadManager.tasks[key]
                  return (
                    <tr key={key}>
                      <td>
                        <Icon iconName={'file'} />
                        <span>{item.fileName}</span>
                      </td>
                      <td>{`${byteToSize(item.resolve)} / ${byteToSize(item.size)}`}</td>
                      <td>{/*todo:操作*/}</td>
                      <td></td>
                    </tr>
                  )
                })}
              </Table>
            </TabPane>
            <TabPane
              id={'3'}
              panetop={
                <>
                  <Header>
                    <Button>全部暂停</Button>
                    <Button>全部开始</Button>
                    <Button>全部删除</Button>
                  </Header>
                  <Bar>
                    <span>正在下载</span>
                  </Bar>
                </>
              }
            >
              <Table header={['文件名', '大小', '操作']}>
                {Object.keys(downloadManager.tasks).map(key => {
                  const item = downloadManager.tasks[key]
                  return (
                    <tr key={key}>
                      <td>
                        <Icon iconName={'file'} />
                        <span>{item.fileName}</span>
                      </td>
                      <td>{`${byteToSize(item.resolve)} / ${byteToSize(item.size)}`}</td>
                      <td>{/*todo:操作*/}</td>
                      <td></td>
                    </tr>
                  )
                })}
              </Table>
            </TabPane>
            <TabPane id={'4'}>3</TabPane>
          </Tabs>
        </div>
      </main>

      {/*<div className='side'>
        <ul>
          <li>
            文件 <Icon iconName='folder' />
          </li>
        </ul>
      </div>
      <div className='main'>
        <div className='header'>
          <ul className='crumbs'>
            <li onClick={() => listFile(-1)}>根目录</li>
            {list.info?.map(item => (
              <li key={item.folderid} onClick={() => listFile(item.folderid)}>
                {item.name}
              </li>
            ))}
          </ul>

          <ul className='functions'>
            <li>新建文件夹：todo</li>
            <li>
              <Dragarea
                onChange={files => {
                  const file = files[0]
                  uploadManager.addTask({
                    fileName: file.name,
                    filePath: file.path,
                    folderId: currentFolder,
                    size: file.size,
                    type: file.type,
                  })
                }}
              />
            </li>
          </ul>
        </div>
        <div
          className='content'
          onDragOver={event => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onDrop={event => {
            const file = event.dataTransfer.files[0]
            uploadManager.addTask({
              fileName: file.name,
              filePath: file.path,
              folderId: currentFolder,
              size: file.size,
              type: file.type,
            })
          }}
        >
          <ul className='files'>
            {list.text?.map((item, i) => {
              return 'fol_id' in item ? (
                <li key={i}>
                  <span onClick={() => listFile(item.fol_id)}>{item.name + '（文件夹）'}</span>
                  {isFile(item.name) && (
                    <span
                      onClick={() =>
                        downloadManager.addTask({
                          fol_id: item.fol_id,
                          name: item.name,
                        })
                      }
                    >
                      （下载）
                    </span>
                  )}
                </li>
              ) : (
                <li key={i} title={item.name_all}>
                  {`${item.name} / ${item.size} / ${item.time}`}
                  <span
                    onClick={() =>
                      downloadManager.addTask({
                        id: item.id,
                        name_all: item.name_all,
                      })
                    }
                  >
                    （下载）
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
        <Footer />
      </div>*/}

      <Modal visible={visible}>
        <div className='dialog'>
          <h3>文件名</h3>
          <Input
            value={form.name}
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
            <Button type={'primary'} onClick={makeDir}>
              保存
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
})

export default App

interface BarProps {
  // crumbs: CrumbsInfo[]
  // onClick: (folderid) => void
}

const Bar: React.FC<BarProps> = props => {
  return (
    <div className='bar'>
      {props.children}
      {/*<ul className='crumbs'>*/}
      {/*  <li onClick={() => props.onClick(-1)}>全部文件</li>*/}
      {/*  {props.crumbs.map(item => (*/}
      {/*    <li key={item.folderid} onClick={() => props.onClick(item.folderid)}>*/}
      {/*      <Icon iconName='right' />*/}
      {/*      {item.name}*/}
      {/*    </li>*/}
      {/*  ))}*/}
      {/*</ul>*/}
    </div>
  )
}

Bar.defaultProps = {
  crumbs: [],
}

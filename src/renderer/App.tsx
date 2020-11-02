import React, {useEffect, useMemo, useState} from 'react'
import './App.css'
import {ls} from '../common/file/ls'
import {isFile} from '../common/util'
import {uploadManager} from '../common/manager/UploadManager'
import Footer from './Footer'
import {downloadManager} from '../common/manager/DownloadManager'
import {Dragarea} from './Dragarea'
import {Icon} from './Icon'
import {Menu, MenuItem, MenuProvider} from './component/Menu'
import {TabPane, Tabs} from './component/Tabs'
import {Split, Table} from './component/Table'

type List = AsyncReturnType<typeof ls>

function App() {
  const [menu, setMenu] = useState('')

  const [list, setList] = useState({} as List)
  const currentFolder = useMemo(() => list.info?.find(item => item.now === 1)?.folderid || -1, [list])

  useEffect(function () {
    // listFile(-1)
  }, [])

  function listFile(folder_id) {
    ls(folder_id).then(value => setList(value))
  }

  return (
    <div className='App'>
      <header className='header'></header>
      <main className='main'>
        <aside className='aside'>
          {/*<MenuProvider defaultKey={'file'} onChange={key => setMenu(key)}>*/}
          <MenuProvider defaultKey={'upload'} onChange={key => setMenu(key)}>
            <Menu>
              <MenuItem id={'file'} icon={'file'}>
                全部文件
              </MenuItem>
            </Menu>
            <Menu title={'传输列表'}>
              <MenuItem id={'upload'} icon={'upload'}>
                正在上传
              </MenuItem>
              <MenuItem id={'download'} icon={'download'}>
                正在下载
              </MenuItem>
              <MenuItem id={'finish'} icon={'finish'}>
                传输完成
              </MenuItem>
            </Menu>
          </MenuProvider>
        </aside>
        <div className='content'>
          <Tabs activeKey={menu}>
            <TabPane
              id={'file'}
              panetop={<Bar crumbs={list.info} onClick={folderid => listFile(folderid)} />}
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
                  return 'id' in item ? (
                    <tr key={item.id}>
                      <td>
                        <Icon iconName={'file'} />
                        <span>{item.name_all}</span>
                      </td>
                      <td>{item.size}</td>
                      <td>{item.time}</td>
                      <td>{item.downs}</td>
                      <td></td>
                    </tr>
                  ) : (
                    <tr key={item.fol_id}>
                      {isFile(item.name) ? (
                        <td>
                          <Icon iconName={'file'} />
                          <span
                            onClick={() =>
                              downloadManager.addTask({
                                fol_id: item.fol_id,
                                name: item.name,
                              })
                            }
                          >
                            {item.name}
                          </span>
                        </td>
                      ) : (
                        <td>
                          <Icon iconName='folder' />
                          <span onClick={() => listFile(item.fol_id)}>{item.name}</span>
                        </td>
                      )}
                      <td>-</td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  )
                })}
              </Table>
            </TabPane>
            <TabPane id={'upload'}>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
              <p>2</p>
            </TabPane>
            <TabPane id={'download'}>3</TabPane>
            <TabPane id={'finish'}>3</TabPane>
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
    </div>
  )
}

export default App

interface BarProps {
  crumbs: CrumbsInfo[]
  onClick: (folderid) => void
}

const Bar: React.FC<BarProps> = props => {
  return (
    <div className='bar'>
      <ul className='crumbs'>
        <li onClick={() => props.onClick(-1)}>全部文件</li>
        {props.crumbs.map(item => (
          <li key={item.folderid} onClick={() => props.onClick(item.folderid)}>
            <Icon iconName='right' />
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

Bar.defaultProps = {
  crumbs: [],
}

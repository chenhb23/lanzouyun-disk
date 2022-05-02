import React, {useEffect, useState} from 'react'
import path from 'path'
import {ScrollView} from '../component/ScrollView'
import {Header} from '../component/Header'
import {Button} from '../component/Button'
import {lsShare, LsShareObject, URLType} from '../../common/core/ls'
import {Input} from '../component/Input'
import {Bar} from '../component/Bar'
import {Icon} from '../component/Icon'
import {useLoading} from '../hook/useLoading'
import {download} from '../store'
import {message} from '../component/Message'
import {isFile} from '../../common/util'
import Table from '../component/Table'

const regExp = /^(.+) 密码: ?(.+)$/

export default function Parse() {
  const [shareFiles, setShareFiles] = useState({} as LsShareObject)

  const [merge, setMerge] = useState(false)

  const {loading, listener, listenerFn} = useLoading()
  const [urlForm, setUrlForm] = useState({url: '', pwd: ''})

  const [selectedRows, setSelectedRows] = useState<LsShareObject['list']>([])

  // 如果只下载其中一部分文件，不进行合并
  useEffect(() => {
    if (selectedRows.length && merge) {
      setMerge(false)
    }
  }, [merge, selectedRows.length])

  const parse = async () => {
    const value = await listener(lsShare(urlForm), 'lsShare')
    setShareFiles(value)
    setMerge(URLType.folder === value.type && isFile(value.name))
    setSelectedRows(prev => (prev.length ? [] : prev))
  }

  return (
    <ScrollView
      HeaderComponent={
        <>
          <Header>
            <Input
              value={urlForm.url}
              onKeyDown={event => event.key === 'Enter' && parse()}
              onChange={event => {
                const value = event.target.value
                if (regExp.test(value)) {
                  const [_, url, pwd] = value.match(regExp)
                  setUrlForm(prevState => ({...prevState, url, pwd}))
                } else {
                  setUrlForm(prevState => ({...prevState, url: value}))
                }
              }}
              placeholder='* https://...  回车键解析'
            />
            <Input
              value={urlForm.pwd}
              onKeyDown={event => event.key === 'Enter' && parse()}
              onChange={event => {
                setUrlForm(prevState => ({...prevState, pwd: event.target.value}))
              }}
              placeholder='提取密码，选填'
              style={{width: 110, marginLeft: 10, marginRight: 10}}
            />

            <Button
              type={'primary'}
              loading={loading['lsShare']}
              style={{minWidth: 100}}
              onClick={() => {
                if (!urlForm.url) return message.info('请输入url')

                parse()
              }}
            >
              解析
            </Button>
            {selectedRows.length ? (
              <Button
                style={{minWidth: 100}}
                loading={loading['download']}
                onClick={async () => {
                  await listenerFn(async () => {
                    for (const row of selectedRows) {
                      await download.addTask({
                        name: row.name,
                        url: row.url,
                        pwd: row.pwd,
                        merge: false,
                      })
                    }
                  }, 'download')
                  message.success(`已添加 ${selectedRows.length} 项任务到下载列表`)
                  setSelectedRows([])
                }}
              >
                下载 ({selectedRows.length}项)
              </Button>
            ) : (
              <Button
                style={{minWidth: 100}}
                disabled={!shareFiles.list?.length}
                loading={loading['addShareTask']}
                onClick={async () => {
                  await listener(
                    download.addTask({
                      name: shareFiles.name,
                      url: urlForm.url,
                      pwd: urlForm.pwd,
                      merge: merge,
                    }),
                    'addShareTask'
                  )
                  message.success('下载任务添加成功')
                }}
              >
                下载全部
              </Button>
            )}
          </Header>
          <Bar>
            <span>{shareFiles.name ? `${shareFiles.name}（${shareFiles.size}）` : '文件列表'}</span>
            <label style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
              <input
                disabled={!!selectedRows.length}
                checked={merge}
                type='checkbox'
                onChange={event => setMerge(event.target.checked)}
              />
              自动合并
            </label>
          </Bar>
        </>
      }
    >
      <Table
        rowKey={'url'}
        dataSource={shareFiles.list}
        onRow={record => ({
          onClick: () => {
            setSelectedRows(prev =>
              prev.some(value => value.url === record.url)
                ? prev.filter(value => value.url !== record.url)
                : [...prev, record]
            )
          },
        })}
        rowSelection={{
          selectedRowKeys: selectedRows.map(value => value.url),
          onChange: (selectedRowKeys, selectedRows) => setSelectedRows(selectedRows),
        }}
        columns={[
          {
            title: '文件名',
            render: item => {
              const extname = path.extname(item.name).replace(/^\./, '')
              return (
                <>
                  <Icon iconName={extname} defaultIcon={'file'} />
                  <span>{item.name}</span>
                </>
              )
            },
          },
          {title: '时间', dataIndex: 'time'},
          {title: '大小', dataIndex: 'size'},
          {
            title: '操作',
            render: item => (
              <Icon
                iconName={'download'}
                onClick={async event => {
                  event.stopPropagation()
                  await download.addTask({
                    name: item.name,
                    url: item.url,
                    pwd: item.pwd,
                    merge: false,
                  })
                  await message.success('已添加到下载列表')
                }}
              />
            ),
          },
        ]}
      />
    </ScrollView>
  )
}

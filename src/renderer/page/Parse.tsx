import React, {useState} from 'react'
import {ScrollView} from '../component/ScrollView'
import {Header} from '../component/Header'
import {Button} from '../component/Button'
import {lsShare, LsShareObject, ShareType} from '../../common/core/ls'
import {Input} from '../component/Input'
import {Bar} from '../component/Bar'
import {Table} from '../component/Table'
import {Icon} from '../component/Icon'
import {useRequest} from '../hook/useRequest'
import {download} from '../store'
import {message} from '../component/Message'

const regExp = /^(.+) 密码: (.+)$/

export default function Parse() {
  const [shareFiles, setShareFiles] = useState({} as LsShareObject)

  const [merge, setMerge] = useState(false)

  const {loading, request} = useRequest()
  const [urlForm, setUrlForm] = useState({url: '', pwd: ''})

  return (
    <ScrollView
      HeaderComponent={
        <>
          <Header>
            <Input
              value={urlForm.url}
              onChange={event => {
                const value = event.target.value
                if (regExp.test(value)) {
                  const [_, url, pwd] = value.match(regExp)
                  setUrlForm(prevState => ({...prevState, url, pwd}))
                } else {
                  setUrlForm(prevState => ({...prevState, url: value}))
                }
              }}
              placeholder='* https://...'
            />
            <Input
              value={urlForm.pwd}
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

                request(lsShare(urlForm), 'lsShare')
                  .then(value => setShareFiles(value))
                  .catch(e => {
                    message.error(e)
                  })
              }}
            >
              解析
            </Button>
            <Button
              disabled={!shareFiles.list?.length}
              loading={loading['addShareTask']}
              onClick={() => {
                if ([ShareType.folder, ShareType.pwdFolder].includes(shareFiles.type)) {
                  request(
                    download.addShareFolderTask({
                      ...urlForm,
                      merge,
                    }),
                    'addShareTask'
                  ).then(() => message.success('下载任务添加成功'))
                } else {
                  request(download.addShareFileTask(urlForm), 'addShareTask').then(() =>
                    message.success('下载任务添加成功')
                  )
                }
              }}
            >
              下载全部
            </Button>
          </Header>
          <Bar>
            <span>{shareFiles.name ? `${shareFiles.name}（${shareFiles.size}）` : '文件列表'}</span>
            <label>
              <input checked={merge} type='checkbox' onChange={event => setMerge(event.target.checked)} />
              自动合并
            </label>
          </Bar>
        </>
      }
    >
      <Table header={['文件名', '时间', '大小', '操作']}>
        {shareFiles.list?.map(item => {
          return (
            <tr key={item.name}>
              <td>
                <Icon iconName={'file'} />
                <span>{item.name}</span>
              </td>
              <td>{item.time}</td>
              <td>{item.size}</td>
              <td>
                <Icon
                  iconName={'download'}
                  onClick={() => {
                    download.addShareFileTask({
                      url: item.url,
                      pwd: item.pwd,
                    })
                  }}
                />
              </td>
              <td></td>
            </tr>
          )
        })}
      </Table>
    </ScrollView>
  )
}

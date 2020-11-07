import React, {useState} from 'react'
import {ScrollView} from '../component/ScrollView'
import {Header} from '../component/Header'
import {Button} from '../component/Button'
import {lsShare, LsShareItem} from '../../common/core/ls'
import {Input} from '../component/Input'
import {Bar} from '../component/Bar'
import {Table} from '../component/Table'
import {Icon} from '../component/Icon'
import {useRequest} from '../hook/useRequest'
import download from '../store/Download'
import {message} from '../component/Message'

export default function Parse() {
  const [list, setList] = useState<LsShareItem[]>([])
  const [fileName, setFileName] = useState('')

  const {loading, request} = useRequest()
  const [urlForm, setUrlForm] = useState({
    url: '',
    pwd: '',
  })

  return (
    <ScrollView
      HeaderComponent={
        <>
          <Header>
            <Input
              value={urlForm.url}
              onChange={event => {
                setUrlForm(prevState => ({...prevState, url: event.target.value}))
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
              disabled={!urlForm.url}
              type={'primary'}
              loading={loading['lsShare']}
              style={{minWidth: 100}}
              onClick={() => {
                request(lsShare(urlForm), 'lsShare')
                  .then(value => {
                    setFileName(`${value.name} ${value.size}`)
                    setList(value.list)
                  })
                  .catch(e => {
                    message.error(e)
                  })
              }}
            >
              解析
            </Button>
            {/*<Button
              type={'primary'}
              loading={loading['lsFile']}
              style={{minWidth: 100}}
              onClick={() => {
                request(downloadPageInfo(urlForm), 'lsFile').then(value => {
                  setList([
                    {
                      ...value,
                      ...urlForm,
                    },
                  ])
                })
              }}
            >
              解析文件
            </Button>*/}
            <Button
              disabled={!list.length}
              onClick={() => {
                console.log('aaaaaaaaa')
              }}
            >
              下载全部
            </Button>
          </Header>
          <Bar>
            <span>{fileName || '文件列表'}</span>

            <label>
              <input type='checkbox'></input>
              自动合并
            </label>
          </Bar>
        </>
      }
    >
      <Table header={['文件名', '大小', '操作']}>
        {list.map(item => {
          return (
            <tr key={item.name}>
              <td>
                <Icon iconName={'file'} />
                <span>{item.name}</span>
              </td>
              <td>{item.size}</td>
              <td>
                <Icon
                  iconName={'download'}
                  onClick={() => {
                    download.addShareFileTask({
                      url: item.url,
                      pwd: item.pwd,
                    })
                    // item
                    // downloadManager.addTask({
                    //   id: item.id,
                    //   fileName: item.name_all,
                    //   isFile: true,
                    // })
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

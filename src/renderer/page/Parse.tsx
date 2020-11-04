import React, {useState} from 'react'
import {ScrollView} from '../component/ScrollView'
import {Header} from '../component/Header'
import {Button} from '../component/Button'
import {lsShareFolder} from '../../common/core/ls'
import {Input} from '../component/Input'
import {Bar} from '../component/Bar'
import {Table} from '../component/Table'
import {downloadManager} from '../../common/manager/DownloadManager'
import {Icon} from '../component/Icon'
import {byteToSize} from '../../common/util'
import {TabPane} from '../component/Tabs'
import {useRequest} from '../utils/useRequest'
import {parseTargetUrl} from '../../common/core/download'

export default function Parse() {
  const [list, setList] = useState<ShareFile[]>([])

  const {loading, request} = useRequest()
  const [urlForm, setUrlForm] = useState({
    url: 'https://wws.lanzous.com/b01topa9e',
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
              type={'primary'}
              loading={loading['lsShareFolder']}
              style={{minWidth: 100}}
              onClick={() => {
                request(lsShareFolder(urlForm), 'lsShareFolder').then(value => {
                  setList(value)
                  // const origin = new URL(urlForm.url).origin
                  // parseTargetUrl({
                  //   is_newd: origin,
                  //   f_id: value[0].id,
                  // }).then(console.log)
                })
              }}
            >
              解析
            </Button>
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
            <span>文件列表</span>
          </Bar>
        </>
      }
    >
      <Table header={['文件名', '大小', '操作']}>
        {list.map(item => {
          return (
            <tr key={item.id}>
              <td>
                <Icon iconName={'file'} />
                <span>{item.name_all}</span>
              </td>
              <td>{item.size}</td>
              <td>
                <Icon
                  iconName={'download'}
                  onClick={() => {
                    downloadManager.addTask({
                      id: item.id,
                      fileName: item.name_all,
                      isFile: true,
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

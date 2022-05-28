import React, {useCallback, useEffect, useState} from 'react'
import type {EventDataNode} from 'antd/lib/tree'
import {lsDir} from '../../../common/core/ls'
import {delay} from '../../../common/util'
import {Modal, Tree} from 'antd'
import {MyIcon} from '../../component/Icon'

interface SelectFolderModalProps {
  currentFolder: FolderId
  onCancel?: () => void
  onOk: (folderId: FolderId, level: number) => Promise<void>
}

interface DataNode {
  title: string
  key: React.Key
  disabled?: boolean
  isLeaf?: boolean
  children?: DataNode[]
}

function updateTreeData(list: DataNode[], key: React.Key, children: DataNode[]): DataNode[] {
  return list.map(node => {
    if (node.key === key) {
      return {...node, children}
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, children),
      }
    }
    return node
  })
}

export function SelectFolderModal(props: SelectFolderModalProps) {
  const [data, setData] = useState<DataNode[]>([{key: -1, title: '全部文件'}])
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [select, setSelect] = useState<EventDataNode>(null)

  const ls = useCallback(async (id = -1, isEndLeaf = false) => {
    const {text} = await lsDir(id)
    setData(prev =>
      updateTreeData(
        prev,
        id,
        text.map(value => {
          const data: DataNode = {key: `${value.fol_id}`, title: value.name}
          if (isEndLeaf) {
            data.isLeaf = true
          }
          return data
        })
      )
    )
    // ant design 的 bug，不然显示不了数据
    await delay(1)
  }, [])

  const visible = !!props.currentFolder

  useEffect(() => {
    if (visible) {
      ls('-1')
    }
  }, [ls, visible])

  return (
    <Modal
      width={600}
      visible={visible}
      title={'选择文件夹'}
      confirmLoading={confirmLoading}
      okText={
        <span style={{maxWidth: 150, textOverflow: 'ellipsis', overflow: 'hidden'}}>
          {!select?.title
            ? '请选择目录'
            : select?.key === props.currentFolder
            ? '不能移动到相同目录'
            : `移动到：${select.title}`}
        </span>
      }
      cancelButtonProps={{style: {verticalAlign: 'middle'}}}
      okButtonProps={{
        type: 'primary',
        disabled: !select || select.key === props.currentFolder,
        style: {verticalAlign: 'middle'},
      }}
      onCancel={props.onCancel}
      onOk={() => {
        setConfirmLoading(true)
        props.onOk(select.key, select.pos.split('-').length - 2).finally(() => setConfirmLoading(false))
      }}
      bodyStyle={{minHeight: 200}}
      destroyOnClose
      afterClose={() => setSelect(null)}
    >
      <Tree
        defaultExpandedKeys={[-1]}
        blockNode
        height={500}
        showIcon
        onSelect={(selectedKeys, e) => setSelect(e.selected ? e.node : null)}
        icon={<MyIcon iconName={'folder'} />}
        loadData={async treeNode => {
          const isEndLeaf = treeNode.pos.split('-').length >= 5
          await ls(treeNode.key, isEndLeaf)
        }}
        treeData={data}
      />
    </Modal>
  )
}

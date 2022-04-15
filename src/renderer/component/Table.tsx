import React, {useCallback, useMemo, useState} from 'react'
import {Split} from './Split'
import './Table.css'

interface Column<T = any> {
  title: React.ReactNode
  dataIndex?: string
  width?: number
  render?: (record: T) => React.ReactNode
  sorter?: (a: T, b: T) => number
  /**
   * @default desc
   */
  sortOrder?: 'asc' | 'desc'
}

export interface TableProps<T = any> {
  rowKey: string | ((record: T, index?: number) => string)
  dataSource: T[]
  rowSelection?: {
    selectedRowKeys?: React.Key[]
    defaultSelectedRowKeys?: React.Key[]
    /**
     * @param selectedRowKeys 全部的
     * @param selectedRows 当前页的 selectedRows
     */
    onChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void
    onSelect?: (record: T, checked: boolean, selectedRows: T[]) => void
    // changeRows 可能比 selectedRows 少
    onSelectAll?: (checked: boolean, selectedRows: T[], changeRows: T[]) => void
  }
  columns: Column<T>[]
}

const rowValue = (rowKey: TableProps['rowKey'], record: TableProps['dataSource'][number], index?: number): React.Key =>
  typeof rowKey === 'function' ? rowKey(record, index) : record[rowKey]

/**
 * mobx 和 table 的结合使用
 * 1. dataSource={[...download.list]} 使用新的引用，让列表更新
 * 2. import {Observer} from 'mobx-react'
 *    // 监听数据的更新
 *    <Observer>{() => <span>{`${byteToSize(item.resolve)} / ${byteToSize(item.total)}`}</span>}</Observer>
 */
export default function Table<T>(props: TableProps<T>) {
  const [widths, setWidths] = useState(props.columns.map((value, index) => value.width ?? (index === 0 ? 490 : 150)))
  const [offsets, _setOffsets] = useState(props.columns.map(() => 0))
  const setOffsets = useCallback((offset: number, index: number) => {
    _setOffsets(prevState => prevState.map((item, i) => (i === index ? offset : item)))
  }, [])

  const [sort, setSort] = useState<Pick<Column, 'title' | 'sorter' | 'sortOrder'> & {_sortOrder: Column['sortOrder']}>(
    null
  )

  const dataSource = useMemo(() => {
    if (!sort) {
      return props.dataSource
    }
    return [...props.dataSource].sort((a, b) => {
      const sortNum = sort.sorter(a, b)
      if (sort.sortOrder === 'asc') return -sortNum
      return sortNum
    })
  }, [props.dataSource, sort])

  const selection = !!props.rowSelection
  const [_selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>(props.rowSelection?.defaultSelectedRowKeys ?? [])
  const selectedRowKeys = props.rowSelection?.selectedRowKeys ?? _selectedRowKeys

  const selectAll =
    !!dataSource.length && dataSource.every((value, i) => selectedRowKeys.includes(rowValue(props.rowKey, value, i)))

  return (
    <table
      className={'Table'}
      onDragEnter={event => {
        event.preventDefault()
        event.stopPropagation()
      }}
      onDragLeave={event => {
        event.preventDefault()
        event.stopPropagation()
      }}
    >
      <thead>
        <tr>
          {selection && (
            <th style={{width: 20}}>
              <input
                type={'checkbox'}
                checked={selectAll}
                onChange={event => {
                  const checked = event.target.checked
                  if (checked) {
                    const changeRows = dataSource.filter(
                      (value, i) => !selectedRowKeys.includes(rowValue(props.rowKey, value, i))
                    )
                    props.rowSelection?.onSelectAll?.(checked, dataSource, changeRows)
                    props.rowSelection?.onChange?.(
                      Array.from(
                        new Set([...selectedRowKeys, ...dataSource.map((value, i) => rowValue(props.rowKey, value, i))])
                      ),
                      dataSource
                    )
                  } else {
                    props.rowSelection?.onSelectAll?.(checked, [], dataSource)
                    props.rowSelection?.onChange?.(
                      selectedRowKeys.filter(value =>
                        dataSource.every((item, i) => rowValue(props.rowKey, item, i) !== value)
                      ),
                      []
                    )
                  }
                }}
              />
            </th>
          )}

          {props.columns.map((value, index) => {
            return (
              <th
                {...(value.sorter
                  ? {
                      onClick: () => {
                        setSort(prev => {
                          if (prev?.title !== value.title) {
                            if (!value.sortOrder) {
                              value.sortOrder = 'desc'
                            }
                            return {...value, _sortOrder: value.sortOrder}
                          }
                          if (prev.sortOrder === prev._sortOrder) {
                            return {...prev, sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc'}
                          }
                          return null as any
                        })
                      },
                    }
                  : {})}
                key={index}
                style={{width: widths[index] + offsets[index]}}
              >
                {value.title}
                {sort?.title === value.title ? (sort.sortOrder === 'desc' ? ' ↓' : ' ↑') : null}

                <Split
                  onMove={dx => {
                    setOffsets(dx, index)
                  }}
                  onRelease={dx => {
                    setWidths(prevState => prevState.map((item, i) => (i === index ? Math.max(50, item + dx) : item)))
                    setOffsets(0, index)
                  }}
                />
              </th>
            )
          })}
          <th></th>
        </tr>
      </thead>
      <tbody>
        {dataSource?.map((record, index) => {
          const rowKey = rowValue(props.rowKey, record, index)
          return (
            <tr key={rowKey}>
              {selection && (
                <td>
                  <input
                    type={'checkbox'}
                    checked={selectedRowKeys.includes(rowKey)}
                    onChange={event => {
                      const checked = event.target.checked
                      const nextRowKeys = checked
                        ? [...selectedRowKeys, rowKey]
                        : selectedRowKeys.filter(value => value !== rowKey)
                      const nextRows = dataSource.filter((value, i) => {
                        const keyValue = rowValue(props.rowKey, value, i)
                        return nextRowKeys.includes(keyValue)
                      })
                      setSelectedRowKeys(nextRowKeys)
                      props.rowSelection?.onSelect?.(record, checked, nextRows)
                      props.rowSelection?.onChange?.(nextRowKeys, nextRows)
                    }}
                  />
                </td>
              )}
              {props.columns.map((value, index) => {
                return (
                  <td key={index}>
                    {typeof value.render === 'function' ? value.render(record) : record[value.dataIndex]}
                  </td>
                )
              })}
              <td></td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

Table.defaultProps = {
  dataSource: [],
}

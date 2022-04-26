import React, {createContext, PropsWithChildren, useContext, useState} from 'react'
import './Table.css'
import {Split} from './Split'

const TableContext = createContext(false)

export interface TableOldProps {
  header?: (string | React.ReactNode)[]
  selectable?: boolean
}

export const TableOld: React.FC<PropsWithChildren<TableOldProps>> = props => {
  const [widthList, setWidthList] = useState(props.header?.map((item, i) => (i === 0 ? 490 : 150)))
  const [distanceList, setDistanceList] = useState(props.header?.map(() => 0))

  const setDistance = (dist, index) => {
    setDistanceList(prevState => prevState?.map((item, i) => (i === index ? dist : item)))
  }
  const setWidth = (width, index) => {
    setWidthList(prevState => prevState.map((item, i) => (i === index ? width : item)))
  }

  return (
    <TableContext.Provider value={props.selectable}>
      <table
        className={`Table ${props.selectable ? 'selectable' : ''}`}
        cellSpacing={0}
        onDragEnter={event => {
          event.preventDefault()
          event.stopPropagation()
        }}
        onDragLeave={event => {
          event.preventDefault()
          event.stopPropagation()
        }}
      >
        {props.header && (
          <thead>
            <tr>
              {!!props.selectable && (
                <td style={{width: 20}}>
                  <input type='checkbox' />
                </td>
              )}
              {props.header.map((item, i) => (
                <th key={i} style={{width: widthList[i] + distanceList[i]}}>
                  {item}
                  <Split
                    onMove={distance => {
                      setDistance(distance, i)
                    }}
                    onRelease={distance => {
                      setWidth(widthList[i] + distance, i)
                      setDistance(0, i)
                    }}
                  />
                </th>
              ))}
              <th />
            </tr>
          </thead>
        )}
        <tbody>{props.children}</tbody>
      </table>
    </TableContext.Provider>
  )
}

type TrProps = {
  id?: string
  onChange?: (checked: boolean) => void
} & JSX.IntrinsicElements['tr']

export const Tr: React.FC<TrProps> = ({className = '', ...props}) => {
  const selectable = useContext(TableContext)
  const [active, setActive] = useState(false)

  return (
    <tr className={`${className} ${active ? 'active' : ''}`} {...props}>
      {selectable && (
        <td>
          <input onChange={event => setActive(event.target.checked)} type='checkbox' />
        </td>
      )}
      {props.children}
    </tr>
  )
}

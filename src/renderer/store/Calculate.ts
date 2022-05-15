import {makeAutoObservable} from 'mobx'
import {persist} from 'mobx-persist'

export interface TaskRecord {
  date: string // 20220514
  record: {[uid: string]: number}
}

// 统计流量
export class Calculate {
  @persist uploads: TaskRecord[] = []

  constructor() {
    makeAutoObservable(this)
  }

  get today() {
    const date = new Date()
    return `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`
  }

  getRecordSize() {
    const today = this.today
    const taskRecord = this.uploads.find(value => value.date === today)
    if (!taskRecord) return 0
    const record = taskRecord.record
    return Object.keys(record).reduce((prev, key) => prev + record[key], 0)
  }

  setRecord(uid: string, size: number) {
    const today = this.today
    let record = this.uploads.find(value => value.date === today)
    if (!record) {
      record = {date: today, record: {}}
      this.uploads.push(record)
    }
    record.record[uid] = size
  }
}

export const calculate = new Calculate()

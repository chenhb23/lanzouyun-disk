import {isSpecificFile} from './util'

describe('测试 util', () => {
  it('测试 isSpecificFile 匹配规则', () => {
    expect(isSpecificFile('xxxx')).toBe(false)
    expect(isSpecificFile('xxxx.zip')).toBe(false)
    expect(isSpecificFile('xxxx.lzy.zip')).toBe(true)
    expect(isSpecificFile('xxxx.lzy.rar')).toBe(false)
    expect(isSpecificFile('xxxx.azw3.osz')).toBe(false)
    expect(isSpecificFile('xxxx.zip.azw3.osz')).toBe(true)
    expect(isSpecificFile('xxxx.zip.o01azw3.osz')).toBe(false)
    expect(isSpecificFile('xxxx.mp4.09.zip.mobi')).toBe(false)
  })
})

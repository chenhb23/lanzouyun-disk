const fs = require('fs')
const iconFront = require('./iconfont.json')
const path = require('path')

const names = iconFront.glyphs.map(value => `  | '${value.font_class}'`)
const namesStr = `type IconName =
${names.join('\n')}
  | string
`

fs.writeFileSync(path.join(__dirname, '..', 'name.d.ts'), namesStr)
console.log('IconName 生成结束')

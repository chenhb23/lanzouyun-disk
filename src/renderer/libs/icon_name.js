const iconFront = require('./iconfont.json')

console.log(iconFront.glyphs.map(value => `'${value.font_class}'`).join('|'))

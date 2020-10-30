import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'
import rimraf from 'rimraf'

import split from './render/utils/split'
import merge from "./render/utils/merge";

const filePath = '/Users/chb/Downloads/webstorm/WebStorm-2020.2.2.dmg.ac.dmg'
const slice1 = filePath + '.test1'
const slice2 = filePath + '.test2'
const target = '/Users/chb/Downloads/webstorm/Wb.dmg'

console.log('31'.padStart(3, '0'))

// async function start() {
//   const dir = '/Users/chb/.lanzouyun/L4qQcW'
//   const tDir = '/Users/chb/Downloads/webstorm/Wb3.dmg'
//   const dirs = fs.readdirSync(dir).map(item => path.resolve(dir, item))
//     // .sort((a, b) => a >= b ? 1 : -1)
//   // console.log(dirs)
//   await merge(dirs, tDir)
//   console.log('finish')
//   rimraf.sync(dir)
// }
// start()

// const lanzouDir = path.resolve(os.homedir(), '.lanzouyun')
// if (!fs.existsSync(lanzouDir)) {
//   fs.mkdirSync(lanzouDir)
// }
// const tempDir = fs.mkdtempSync(lanzouDir + '/')

// console.log('fs.mkdtempSync()', fs.mkdtempSync('main/'));

// console.log('12'.toLowerCase().match(/^(\d+)([kmgt]?)$/))

// console.log(path.basename('/Users/chb/Downloads/webstorm/WebStorm-2020.2.2.dmg.ac.dmg0'))

// async function start() {
//   console.log('start')
//   const dir = await split(filePath, '20m')
//   console.log('dir', dir)
//   console.log('finish')
//
//   // rimraf.sync('/Users/chb/.lanzouyun/bbBRiR')
// }
// start()

// const stat = fs.statSync(filePath)
// console.log(stat.size, stat.size / 1024 / 1024, 'm')
// const k = 1024
// const m = k * 1024
//
// const fr = fs.createReadStream(filePath, {start: 0, end: 50 * m})
// const fw = fs.createWriteStream(filePath + '.test1')
// fr.pipe(fw)
// const fr2 = fs.createReadStream(filePath, {start: 50 * m + 1, end: stat.size})
// const fw2 = fs.createWriteStream(filePath + '.test2')
// fr2.pipe(fw2)

// let len = 0
// fr.on("data", chunk => {
//   // console.log(chunk)
//   len += chunk.length
// })
// fr.on("end", () => {
//   console.log(len, stat.size)
// })


//////////////////////////////////////

// ok ok
// async function write(filePath, target) {
//   return new Promise((resolve, reject) => {
//     const r = fs.createReadStream(filePath)
//     r.pipe(target, {end: false}).on("error", reject)
//     r.on("end", resolve).on("error", reject)
//   })
// }
//
// async function start() {
//   const w = fs.createWriteStream(target, {flags: 'w'})
//   const paths = [slice1, slice2]
//   for (const [i, path] of paths.entries()) {
//     await write(path, w)
//   }
//   console.log('all finish')
// }
//
// start()

////////////////////////////////////////////////
// const w = fs.createWriteStream(target, {
//   flags: 'w',
// })
// const f1 = fs.createReadStream(slice1)
//
// f1.pipe(w, {end: false}).on("finish", () => {
//   const f2 = fs.createReadStream(slice2)
//   f2.pipe(w).on("finish", () => {
//     console.log('finish2')
//   })
// })

////////////////////////////////////////////////

// // ok
// function start() {
//   function merge(paths, target) {
//     if (!paths.length) {
//       console.log('finish merge')
//       return
//     }
//     const r = fs.createReadStream(paths.shift())
//     r.pipe(target, {end: false})
//     r.on("end", () => {
//       merge(paths, target)
//     })
//   }
//
//   const paths = [slice1, slice2]
//   const w = fs.createWriteStream(target, {flags: 'w'})
//   merge(paths, w)
// }
//
// start()

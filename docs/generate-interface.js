const fs = require('fs')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const t = require('@babel/types')

const code = fs.readFileSync('./comm.js').toString()
const ast = parser.parse(code)

const interfaceArray = []

traverse(ast, {
  FunctionDeclaration: (path) => {
    path.traverse({
      CallExpression: (path1) => {
        if (t.isIdentifier(path1.node.callee.object, {name: '$'}) && t.isIdentifier(path1.node.callee.property, {name: 'ajax'})) {
          path1.traverse({
            ObjectExpression: (path2) => {
              // 删除 success: function() {},
              path2.get('properties').forEach(value => {
                if (t.isIdentifier(value.node.key, {name: 'success'}) || t.isIdentifier(value.node.key, {name: 'error'})) {
                  value.remove()
                }
              })
              // 过滤掉 {'t': 1}
              if (path2.node.properties.some(value => (
                t.isIdentifier(value.key, {name: 'url'}) && t.isStringLiteral(value.value, {value: '/doupload.php'})
              ))) {
                path2.traverse({
                  ObjectProperty: (path3) => {
                    if (t.isIdentifier(path3.node.key, {name: 'data'})) {
                      path3.traverse({
                        ObjectProperty: (path4) => {
                          if (t.isStringLiteral(path4.node.key)) {
                            path4.node.key = t.identifier(path4.node.key.value)
                          }
                          if (!t.isIdentifier(path4.node.key, {name: 'task'})) {
                            path4.node.value = t.identifier('any')
                          }
                        },
                      })
                      interfaceArray.push(`${path.node.id.name}: ${generate(path3.node.value, {concise: true}).code}`)
                    }
                  },
                })
              }
            },
          })
        }
      },
    })
  },
}, undefined, {})

console.log(interfaceArray)

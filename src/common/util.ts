import config from '../project.config'

export function sizeToByte(size: string | number) {
  if (typeof size === "string") {
    const getUnit = (unit) => ({
      get k() {
        return 1024
      },
      get m() {
        return this.k * 1024
      },
      get g() {
        return this.m * 1024
      },
      get t() {
        return this.g * 1024
      },
    }[unit] || 1)
    const [_, num, unit] = size.toLowerCase().match(/^(\d+)([kmgt]?)$/)

    return +num * getUnit(unit)
  }

  return size
}

/**
 * 判断是否是分割的文件
 * @returns {boolean}
 */
function isSpecificFile(filePath: string) {
  return new RegExp(`^.*${config.signSuffix}$`).test(filePath)
}

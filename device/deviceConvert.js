import * as fs from 'fs'
import path from 'path'
import { XMLParser } from 'fast-xml-parser'

const romNameList = [
  'IROM1',
  'PROGRAM_FLASH'
]

const ramNameList = [
  'IRAM1',
  'SRAM0'
]

function isInRomList(name) {
  const target = name.toLowerCase()

  return romNameList.some(subStr => target.includes(subStr.toLowerCase()))
}

function isInRamList(name) {
  const target = name.toLowerCase()

  return ramNameList.some(subStr => target.includes(subStr.toLowerCase()))
}

// sort output by label
function ouputSort(root) {
  let stack = [...root]

  while (stack.length > 0) {
    const node = stack.pop()

    if (node.children && node.children.length > 0) {
      node.children.sort((a, b) => a.label.localeCompare(b.label))
      stack.push(...node.children)
    }
  }

  root.sort((a, b) => a.label.localeCompare(b.label))
}

// Vendor -> Series -> Device
(async () => {
  const rootPath = './deviceList'
  const outputPath = './deviceIndex.json'
  let devicePDSCList = []
  let ret = fs.readdirSync(rootPath)

  // get pdsc list
  const vendorDir = ret.filter(file => fs.statSync(path.join(rootPath, file)).isDirectory())
  vendorDir.forEach((vendor) => {
    ret = fs.readdirSync(path.join(rootPath, vendor))
    const seriesDir =
      ret.filter(file => fs.statSync(path.join(rootPath, vendor, file)).isDirectory())
    seriesDir.forEach((series) => {
      let tmpPath = path.join(rootPath, vendor, series)
      ret = fs.readdirSync(tmpPath)

      ret.forEach((fileName) => {
        const filePath = path.join(tmpPath, fileName)
        const stats = fs.lstatSync(filePath)
        if (stats.isFile() && path.extname(fileName) === '.pdsc') {
          devicePDSCList.push({
            filePath: filePath,
            vendor: vendor,
            series: series
          })
        }
      })
    })
  })

  // parse pdsc
  devicePDSCList.forEach((pdsc) => {
    const content = fs.readFileSync(pdsc.filePath, 'utf-8')
    const parser = new XMLParser({
      ignoreAttributes: false
    })
    let pdscObj = parser.parse(content)
    let subFamily = pdscObj.package.devices.family.subFamily
    if (!subFamily) {
      subFamily = pdscObj.package.devices.family
    }

    pdsc.subFamily = []
    if (!Array.isArray(subFamily)) {
      subFamily = [subFamily]
    }
    subFamily.forEach((sub) => {
      ret = {
        name: sub['@_DsubFamily'] || sub['@_Dfamily'],
        devices: []
      }
      if (!Array.isArray(sub.device)) {
        sub.device = [sub.device]
      }
      sub.device.forEach((device) => {
        let tmp = {
          name: device['@_Dname'],
          algorithm: [],
          ram: {},
          rom: {}
        }
        if (!Array.isArray(device.algorithm)) {
          device.algorithm = [device.algorithm]
        }
        device.algorithm.forEach((item) => {
          tmp.algorithm.push({
            default: item['@_default'],
            name: item['@_name'],
            start: item['@_start'],
            size: item['@_size']
          })
        })
        device.memory.forEach((item) => {
          const name = item['@_id'] || item['@_name']
          if (isInRamList(name)) {
            tmp.ram = {
              start: item['@_start'],
              size: item['@_size']
            }
          } else if (isInRomList(name)) {
            tmp.rom = {
              start: item['@_start'],
              size: item['@_size']
            }
          }
        })
        ret.devices.push(tmp)
      })
      pdsc.subFamily.push(ret)
    })
  })

  // save result to file
  const outInFile = fs.readFileSync(outputPath, 'utf-8')

  let data
  try {
    data = JSON.parse(outInFile)
  } catch (error) {
    data = []
  }
  if (!Array.isArray(data)) {
    data = []
  }

  devicePDSCList.forEach((pdsc) => {
    let vendor = data.find(({ label }) => label === pdsc.vendor)
    if (!vendor) {
      vendor = {
        value: pdsc.vendor,
        label: pdsc.vendor,
        children: []
      }
      data.push(vendor)
    }

    let series = vendor.children.find(({ label }) => label === pdsc.series)
    if (!series) {
      series = {
        value: pdsc.series,
        label: pdsc.series,
        children: []
      }
      vendor.children.push(series)
    }

    pdsc.subFamily.forEach((family) => {
      let subFamily = series.children.find(({ label }) => label === family.name)
      if (!subFamily) {
        subFamily = {
          value: family.name,
          label: family.name,
          children: []
        }
        series.children.push(subFamily)
      }

      family.devices.forEach((device) => {
        let item = subFamily.children.find(({ label }) => label === device.name)
        if (!item) {
          item = {
            value: device.name,
            label: device.name,
            algorithm: device.algorithm,
            ram: device.ram,
            rom: device.rom
          }
          subFamily.children.push(item)
        } else {
          item = {
            value: device.name,
            label: device.name,
            algorithm: device.algorithm,
            ram: device.ram,
            rom: device.rom
          }
        }
      })
    })
  })

  ouputSort(data)

  ret = JSON.stringify(data)
  fs.writeFileSync(outputPath, ret)
  console.log('Done.')
})()

import { dapLog } from './log'
import objcopy from 'llvm-objcopy-wasm'

function readFile(file: File): Promise<Uint8Array | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (!reader.result) {
        reject()
      }

      const ret = new Uint8Array(reader.result as ArrayBuffer)
      resolve(ret)
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

async function convertToBin(elf: Uint8Array,
                            isIntelHex: boolean = false): Promise<Uint8Array | null> {
  const handle: EmscriptenPromise = await objcopy({
    'noInitialRun': true
  })

  handle.FS.writeFile('/tmp/input', elf)

  let args
  if (isIntelHex) {
    args = ['-I', 'ihex', '-O', 'binary', '/tmp/input', '/tmp/output']
  } else {
    args = ['-O', 'binary', '/tmp/input', '/tmp/output']
  }

  const exitCode = handle.callMain(args)
  if (exitCode != 0) {
    log(`Failed to convert elf file:${exitCode}`)
    return null
  }

  handle.FS.chmod('/tmp/output', 0o777)
  const ret = handle.FS.readFile('/tmp/output')

  return ret
}

function isIntelHexFormat(data: Uint8Array): boolean {
  if (data[0] != 0x3A) { // Intel Hex start code ':'
    return false
  }

  const getByte = (input: Uint8Array, index: number): number => {
    const data = input.slice(index, index + 2)
    const str = new TextDecoder().decode(data)
    return parseInt(str, 16) & 0xff
  }

  try {
    let index = 1 // skip start code
    let checksum = 0

    const byteCount = getByte(data, index)
    checksum += byteCount
    index += 2

    // address
    for (let i = 0; i < 2; i++) {
      const tmp = getByte(data, index)
      checksum += tmp
      index += 2
    }

    // record type
    const recordType = getByte(data, index)
    checksum += recordType
    index += 2

    // data
    for (let i = 0; i < byteCount; i++) {
      const tmp = getByte(data, index)
      checksum += tmp
      index += 2
    }

    const targetSum = getByte(data, index)
    checksum = ((~checksum) + 1) & 0xff

    return checksum == targetSum
  } catch (error) {
    return false
  }
}

export async function firmwarePreprocess(file: File | undefined): Promise<Uint8Array | undefined> {
  if (typeof file === 'undefined')
    return

  let fileArray = await readFile(file)
  if (!fileArray || !fileArray.length) {
    dapLog.failLoadFile()
    return
  }

  // check elf magic
  if (fileArray[0] == 0x7F && fileArray[1] == 0x45 &&
      fileArray[2] == 0x4C && fileArray[3] == 0x46) {
    dapLog.elfDetected()

    fileArray = await convertToBin(fileArray, false)
    if (!fileArray || !fileArray.length) {
      dapLog.failConvert()
      return
    }

    dapLog.successConvert()
    dapLog.convertFileSizeInfo(fileArray.length)
  } else if (isIntelHexFormat(fileArray)) {
    dapLog.ihexDetected()

    fileArray = await convertToBin(fileArray, true)
    if (!fileArray || !fileArray.length) {
      dapLog.ihexFailConvert()
      return
    }

    dapLog.successConvert()
    dapLog.convertFileSizeInfo(fileArray.length)
  }

  return fileArray
}

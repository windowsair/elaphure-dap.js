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

async function convertToBin(elf: Uint8Array): Promise<Uint8Array | null> {
  const handle: EmscriptenPromise = await objcopy({
    'noInitialRun': true
  })

  handle.FS.writeFile('/tmp/input', elf)

  const exitCode = handle.callMain(['-O', 'binary', '/tmp/input', '/tmp/output'])
  if (exitCode != 0) {
    log(`Failed to convert elf file:${exitCode}`)
    return null
  }

  handle.FS.chmod('/tmp/output', 0o777)
  const ret = handle.FS.readFile('/tmp/output')

  return ret
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

    fileArray = await convertToBin(fileArray)
    if (!fileArray || !fileArray.length) {
      dapLog.failConvert()
      return
    }

    dapLog.successConvert()
    dapLog.convertFileSizeInfo(fileArray.length)
  }

  return fileArray
}

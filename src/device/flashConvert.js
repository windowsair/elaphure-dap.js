import { promisify } from 'util'
import { exec } from 'child_process'
import { promises as fs } from 'fs'
import * as path from 'path'
import * as r from 'restructure'

async function findExecutable(exes) {
    const envPath = process.env.PATH || ''
    const envExt = process.env.PATHEXT || ''
    const pathDirs = envPath
        .replace(/["]+/g, '')
        .split(path.delimiter)
        .filter(Boolean)
    const extensions = envExt.split(';')
    const candidates = exes.flatMap((exe) =>
        pathDirs.flatMap((d) =>
            extensions.map((ext) => path.join(d, exe + ext))
        )
    )

    try {
        return await Promise.any(candidates.map(checkFileExists))
    } catch (e) {
        return null
    }

    async function checkFileExists(filePath) {
        if ((await fs.stat(filePath)).isFile()) {
            return filePath
        }
        throw new Error('Not a file')
    }
}

// https://github.com/ldc-developers/ldc/blob/master/cmake/Modules/FindLLVM.cmake
async function getLLVMVersion() {
    let res = await findExecutable([
        'llvm-objcopy-18.1', 'llvm-objcopy181', 'llvm-objcopy-18',
        'llvm-objcopy-17.0', 'llvm-objcopy170', 'llvm-objcopy-17',
        'llvm-objcopy-16.0', 'llvm-objcopy160', 'llvm-objcopy-16',
        'llvm-objcopy-15.0', 'llvm-objcopy150', 'llvm-objcopy-15',
        'llvm-objcopy-14.0', 'llvm-objcopy140', 'llvm-objcopy-14',
        'llvm-objcopy-13.0', 'llvm-objcopy130', 'llvm-objcopy-13',
        'llvm-objcopy-12.0', 'llvm-objcopy120', 'llvm-objcopy-12',
        'llvm-objcopy-11.0', 'llvm-objcopy110', 'llvm-objcopy-11',
        'llvm-objcopy'
    ])

    if (!res) {
        console.log('Failed to find LLVM. Check your PATH.')
        process.exit(-1)
    }

    res = path.basename(res)
    // 'llvm-objcopy-18' -> '-18'
    return res.slice('llvm-objcopy'.length)
}

(async () => {
    const llvmVer = await getLLVMVersion()
    const execAsync = promisify(exec)

    const toBin = async (inPath, outPath) => {
        try {
            const cmd = `llvm-objcopy${llvmVer} -O binary \"${inPath}\" \"${outPath}\"`
            const { stdout, stderr } = await execAsync(cmd)
        } catch (e) {
            console.log(e)
            process.exit(-1)
        }
    }

    const trimBin = async (inPath, descAddr, descSize, descTrimSize) => {
        const stats = await fs.stat(inPath)

        if (descAddr + descSize != stats.size) {
            return // skip trim
        }

        await fs.truncate(inPath, descAddr + descTrimSize)
    }

    const get_readelf_res = async (dir) => {
        try {
            const command = `llvm-readobj${llvmVer} --elf-output-style=JSON -s -S \"${dir}\"`
            const { stdout, stderr } = await execAsync(command)
            return JSON.parse(stdout)[0]
        } catch (e) {
            console.log(e)
            process.exit(-1)
        }
    }

    const get_section_address = (input, section) => {
        for (const item of input.Sections) {
            if (item.Section.Name.Name == section) {
                return item.Section.Address
            }
        }

        return null
    }

    /**
     *
     * @param {*} input llvm-readobj output
     * @param {*} type_name type name
     * @param {*} sym_name symbol name
     * @returns [address, size]
     */
    const get_symbol_info = (input, type_name, sym_name) => {
        for (const item of input.Symbols) {
            if (item.Symbol.Name.Name == sym_name &&
                item.Symbol.Type.Name == type_name) {
                return [item.Symbol.Value, item.Symbol.Size]
            }
        }

        return [null, null]
    }

    let files = await fs.readdir('deviceList', { recursive: true })
    let jsonList = files.filter(str => str.endsWith('.json'))
    let flmList = files.filter(str => str.toLowerCase().endsWith('.flm'))
    files = flmList.filter(str => {
        const resPath = str.slice(0, -4) + '.json'
        return !jsonList.includes(resPath)
    })

    for (const item of files) {
        const flmPath = path.join('deviceList', item)
        const binPath = flmPath.slice(0, -4) + '.bin'
        const resJsonPath = flmPath.slice(0, -4) + '.json'

        const elfInfo = await get_readelf_res(flmPath)
        let [initAddr] = get_symbol_info(elfInfo, 'Function', 'Init')
        let [unInitAddr] = get_symbol_info(elfInfo, 'Function', 'UnInit')
        let [eraseChipAddr] = get_symbol_info(elfInfo, 'Function', 'EraseChip')
        let [eraseSectorAddr] = get_symbol_info(elfInfo, 'Function', 'EraseSector')
        let [programPageAddr] = get_symbol_info(elfInfo, 'Function', 'ProgramPage')
        let [descAddr, descSize] = get_symbol_info(elfInfo, 'Object', 'FlashDevice')

        await toBin(flmPath, binPath)

        const fd = await fs.open(binPath, 'r')
        let rawDataDesc = new Uint8Array(descSize)
        let ret = await fd.read(rawDataDesc, 0, descSize, descAddr)
        if (ret.bytesRead != descSize) {
            console.log(`Failed to read device desc: ${binPath}`)
            return -1
        }

        const sectorNum = 512
        const sectorEnd = 0xFFFFFFFF
        const flashSectors = new r.Struct({
            szSector: r.uint32le,
            AddrSector: r.uint32le,
        })
        const flashDescript = new r.Struct({
            Vers: r.uint16le, // Version Number and Architecture
            DevName: new r.String(128), // Device Name and Description
            DevType: r.uint16le, // Device Type: ONCHIP, EXT8BIT, EXT16BIT, ...
            DevAdr: r.uint32le, // Default Device Start Address
            szDev: r.uint32le, // Total Size of Device
            szPage: r.uint32le, // Programming Page Size
            Res: r.uint32le, // Reserved for future Extension
            valEmpty: r.uint8, // Content of Erased Memory
            padding0: new r.Reserved(r.uint8, 3),
            toProg: r.uint32le,  // Time Out of Program Page Function
            toErase: r.uint32le, // Time Out of Erase Sector Function
            sectors: new r.Array(flashSectors, sectorNum),
        })

        let devDesc = flashDescript.fromBuffer(rawDataDesc)
        const originSectorsLen = devDesc.sectors.length
        let i = 0
        for (i = 0; i < devDesc.sectors.length; i++) {
            if (devDesc.sectors[i].AddrSector == sectorEnd &&
                devDesc.sectors[i].szSector == sectorEnd) {
                break
            }
        }
        devDesc.sectors = devDesc.sectors.splice(0, i)

        let trimSectorLen = devDesc.sectors.length
        // include [sectorEnd, sectorEnd], [0, 0]
        if (trimSectorLen < originSectorsLen - 2) {
            trimSectorLen += 2
            // offset(sectors) + sectors length
            const descTrimSize = 160 + 4 * 2 * trimSectorLen
            await trimBin(binPath, descAddr, descSize, descTrimSize)
        }

        // remove null in the end of string
        devDesc.DevName = devDesc.DevName.replace(/\0.*$/g, '')
        let result = JSON.stringify({
            'initAddr': initAddr,
            'unInitAddr': unInitAddr,
            'eraseChipAddr': eraseChipAddr,
            'eraseSectorAddr': eraseSectorAddr,
            'programPageAddr': programPageAddr,
            'descAddr': descAddr,
            'descSize': descSize,
            'devDesc': devDesc,
        })

        await fs.writeFile(resJsonPath, result)
    }

    console.log('Done.')
})()

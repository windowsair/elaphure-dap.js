# How to add new device

## 1. Add `.pdsc` description file and `.FLM` flash file into directory.

```
└── deviceList
    └── Vendor Name
        └── Series Name
            ├── xxx.pdsc
            ├── xxx.FLM
```

## 2. Run device convert:

```bash
node deviceConvert.js
```

This will generate the `deviceIndex.json` file.

## 3. Run flash algorithm convert:

Additional requirements:

- llvm-readobj
- llvm-objcopy

Make sure you have LLVM installed and available in the PATH.

```bash
node flashConvert.js
```

> Need Node.js v20.0.0+ version

This will generate the `xxx.bin` flash program and the `xxx.json` flash program description database file in the same path as the FLM file.

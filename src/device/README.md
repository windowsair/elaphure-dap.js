# How to add new device

1. Add `.pdsc` description file and `.FLM` flash file into directory.

```
└── deviceList
    └── Vendor Name
        └── Series Name
            ├── xxx.pdsc
            ├── xxx.FLM
```

2. Run device convert:

```bash
node deviceConvert.js
```

This will generate the `deviceIndex.json` file.

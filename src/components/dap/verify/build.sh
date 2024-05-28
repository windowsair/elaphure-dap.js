#!/bin/bash

meson setup build/ --cross-file cross_llvm && \
 cd build && ninja && cp crc.bin ../

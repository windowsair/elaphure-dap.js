project('verify', 'c')

objcopy = '@0@'.format(find_program('objcopy').path())

c_args = ['-Os', '-g3', '-fno-exceptions', '-fno-unwind-tables', '-fno-rtti', '-fPIC' ]
cpp_args = ['-Os', '-g3', '-fno-exceptions', '-fno-unwind-tables', '-fno-rtti', '-fPIC' ]

target = [
    'crc.c',
    'dummy.S'
]

compiler = meson.get_compiler('c')
linker_id = compiler.get_linker_id()
if linker_id == 'armlink'
    link_args = ['--diag_suppress', 'L6305'] # Do not print entry warning
    output_name = 'crc'
    elf_name = 'crc.axf'
else
    linker_script = 'linker.ld'
    link_args = ['-Wl,--no-keep-memory', '-T', meson.source_root() / linker_script]
    output_name = 'crc.elf'
    elf_name = 'crc.elf'
endif

crc = executable(output_name,
    target,
    c_args: c_args,
    cpp_args: cpp_args,
    link_args: link_args
)

crcbin = custom_target('crc.bin',
    output           : ['crc.bin'],
    build_by_default : true,
    command          : [objcopy, '-O', 'binary', elf_name, 'crc.bin'],
    depends          : [crc])

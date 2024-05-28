MEMORY
{
  PRG (rx) : ORIGIN = 0x00000000, LENGTH = 1M
}

SECTIONS
{
  .text :
  {
    *(.text*)
  } > PRG

  .data ALIGN(4) :
  {
    *(.data*)
  } > PRG

  /DISCARD/ :
  {
    *(.note .note.*)
    *(.eh_frame .eh_frame.*)
    *(.ARM.extab* .gnu.linkonce.armextab.*)
    *(.ARM.exidx*)
  }
}

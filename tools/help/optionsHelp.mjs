import { defaultOptions } from "../../src/constants.mjs";

export const optionsHelp = [
  'The options string may contain any of the following:',
  '  "p" for preset (`--help preset`)',
  '  "d" for enemy drops (`--help drops`)',
  '  "e" for starting equipment (`--help equipment`)',
  '  "i" for item locations (`--help items`)',
  '  "b" for prologue rewards (`--help rewards`)',
  '  "r" for relic locations (`--help relics`)',
  '  "s" for stats',
  '  "m" for music',
  '  "w" for writes (`--help writes`)',
  '  "k" for turkey mode',
  '  "t" for tournament mode (`--help tournament`)',
  '',
  'The default randomization mode is "'
  + defaultOptions
  + '", which randomizes everything.',
  '',
  'Examples:',
  '  $0 --opt d   # Only randomize enemy drops.',
  '  $0 --opt di  # Randomize drops and item locations.',
  '  $0           # Randomize everything (default mode).',
].join('\n');
const yargsOptions = {
  'in-bin': {
    alias: 'i',
    describe: 'Path to vanilla .bin file',
    conflicts: ['no-seed'],
    type: 'string',
    requiresArg: true,
  },
  'out': {
    alias: 'o',
    describe: 
      'If used with `in-bin` option, path to write randomized .bin file, otherwise, path to write PPF file',
    type: 'string',
    requiresArg: true,
  },
  'seed': {
    alias: 's',
    describe: 'Randomization seed',
    type: 'string',
    requiresArg: true,
  },
  'options': {
    alias: 'opt',
    describe: 'Randomizations (`--help options`)',
    type: 'string',
    requiresArg: true,
  },
  'expect-checksum': {
    alias: 'e',
    describe: 'Verify checksum',
    conflicts: ['no-seed'],
    type: 'string',
    requiresArg: true,
  },
  'url': {
    alias: 'u',
    description: 'Print seed url using optional base',
    type: 'string',
  },
  'race': {
    alias: 'r',
    describe: 'Same as -uvv',
    type: 'boolean',
  },
  'preset': {
    alias: 'p',
    describe: 'Use preset',
    type: 'string',
    requiresArg: true,
  },
  'preset-file': {
    alias: 'f',
    describe: 'Use preset file',
    type: 'string',
    requiresArg: true,
    conflicts: ['preset'],
  },
  'complexity': {
    alias: 'c',
    describe: 'Shortcut to adjust seed complexity',
    type: 'number',
    requiresArg: true,
  },
  'tournament': {
    alias: 't',
    describe: 'Enable tournament mode (`--help tournament`)',
    type: 'boolean',
  },
  'colorrando': {
    alias: 'l',
    describe: 'Enable color palette randomizing for various things',
    type: 'boolean',
  },
  'magicmax': {
    alias: 'x',
    describe: 'Enable replace Heart Max with Magic Max Vessels',
    type: 'boolean',
  },
  'antifreeze': {
    alias: 'z',
    describe: 'Enable Anti-Freeze Mode, removes screen freezes from level-up & more.',
    type: 'boolean',
  },
  'mypurse': {
    alias: 'y',
    describe: 'Prevents Death from stealing your belongings.',
    type: 'boolean',
  },
  'mapcolor': {
    alias: 'm',
    describe: 'Change map color',
    type: 'string',
    requiresArg: true,
  },
  'disable-accessibility-patches': {
    alias: 'a',
    describe: 'Disable accessibility patches',
    type: 'boolean',
  },
  'no-seed': {
    alias: 'n',
    describe: 'Disable seed generation',
    conflicts: ['in-bin', 'expect-checksum'],
    type: 'boolean',
  },
  'verbose': {
    alias: 'v',
    describe: 'Verbosity level',
    type: 'count',
    default: undefined,
  },
  'quiet': {
    alias: 'q',
    describe: 'Suppress output',
    conflicts: 'verbose',
    type: 'boolean',
  },
  'compat': {
    type: 'string',
    requiresArg: true,
  }};

export default yargsOptions;
export const equipmentHelp = [
  'Starting equipment randomization can be toggled with the "e" switch.',
  'Equipment may also be specified using argument syntax.',
  '',
  'Equipment format:',
  '  e[:<slot>[:<item>]][:...]',
  '',
  'Items are specified by removing any non-alphanumeric characters from',
  'their name.',
  '',
  'Slot is one of:',
  '  "r" for right hand',
  '  "l" for left hand',
  '  "h" for head',
  '  "b" for body',
  '  "c" for cloak',
  '  "o" for other',
  '  "a" for Axe Lord armor (Axe Armor mode only)',
  '  "x" for Lapis lazuli (Luck mode only)',
  '',
  'Examples:',
  '  e:l:Marsil:Fireshield  Marsil in left hand, Fire shield in right',
  '  e:o:Duplicator         Duplicator in other slot',
  '  e:c:                   No cloak',
  '',
  'Equipment can be prevented from being starting equipment by prefixing',
  'an equipment slot with a hyphen ("-"):',
  '  e:-r:Crissaegrim            Never start with Crissaegrim',
  '  e:-l:IronShield:DarkShield  Never start with Iron shield or Dark shield',
  '',
  'If other randomization options follow an equip, they must also be',
  'separated from the equip with a comma:',
  '  $0 --opt e:o:Duplicator,dpt',
].join('\n');
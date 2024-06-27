export const rewardsHelp = [
  'Prologue reward randomization can be toggled with the "b" switch.',
  'Rewards may be specified using argument syntax.',
  '',
  'Rewards format:',
  '  b[:<reward>[:<item>]][:...]',
  '',
  'Reward is one of:',
  '  "h" for Heart Refresh',
  '  "n" for Neutron bomb',
  '  "p" for Potion',
  '',
  'Items are specified by removing any non-alphanumeric characters from',
  'their name.',
  '',
  'Examples:',
  '  b:h:MannaPrism   Replace Heart Refresh with Manna Prism',
  '  b:n:PowerofSire  Replace Neutron bomb with Power of Sire',
  '  b:p:BuffaloStar  Replace Potion with Buffalo Star',
  '',
  'Items can be prevented from replacing prologue rewards by prefixing the',
  'reward with a hyphen ("-"):',
  '  b:-h:Uncurse     Never replace Heart Refresh with Uncurse',
  '  b:-n:Turkey-TNT  Never replace Neutron bomb with Turkey or TNT',
  '',
  'If other randomization options follow an item, they must also be',
  'separated from the item with a comma:',
  '  $0 --opt b:h:MannaPrism,dt',
].join('\n');
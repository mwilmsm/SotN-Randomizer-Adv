import presets from '../../build/presets/index.mjs';

export const presetHelp = [
  'Presets specify collection of randomization options. A preset is enabled',
  'by using argument syntax.',
  '',
  'Preset format:',
  '  p:<preset>',
  '',
  'This randomizer has several built-in presets:',
].concat(presets.filter(function (preset) {
  return !preset.hidden;
}).map(function (preset) {
  return '  ' + preset.id + (preset.id === 'safe' ? ' (default)' : '');
})).concat([
  '',
  'Use `--help <preset>` for information on a specific preset.',
  '',
  'Examples:',
  '  p:safe        Use Safe preset',
  '  p:empty-hand  Use Empty Hand preset',
  '',
  'When using the `$0` utility, you can use the `--preset` shorthand to',
  'specify a preset:',
  '  $0 -p speedrun  # Use speedrun preset',
  '',
  'Preset options may be overridden by specifying an options string:',
  '  $0 -p adventure --opt d:*:Peanuts-  # Adventure with only Peanut drops',
  '',
  'A special negation syntax can be used in the options string to disable',
  'randomizations that a preset would otherwise enable. To negate a',
  'randomization, precede its letter with a tilde ("~"):',
  '  $0 -p adventure --opt ~m  # Adventure but without music randomization',
]).join('\n');

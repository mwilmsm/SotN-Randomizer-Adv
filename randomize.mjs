#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Worker } from 'worker_threads';
import * as constants from './src/constants.mjs';
import * as errors from './src/errors.mjs';
import * as extension from './src/extension.mjs';
import * as presets from './build/presets/index.mjs';
import * as randomizeMusic from './src/randomize_music.mjs';
import * as randomizeRelics from './src/randomize_relics.mjs';
import * as randomizeStats from './src/randomize_stats.mjs';
import * as applyAccessibilityPatches from './src/accessibility_patches.mjs';
import * as relics from './src/relics.mjs';
import * as util from './src/util.mjs';
import * as pkg from './package.json' with {type: 'json'};

const version = pkg.version;

Error.stackTraceLimit = Infinity;

const optionsHelp = [
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
    +  constants.defaultOptions
    + '", which randomizes everything.',
  '',
  'Examples:',
  '  $0 --opt d   # Only randomize enemy drops.',
  '  $0 --opt di  # Randomize drops and item locations.',
  '  $0           # Randomize everything (default mode).',
].join('\n')

const dropsHelp = [
  'Enemy drop randomization can be toggled with the "d" switch. Drops may',
  'also be specified using argument syntax.',
  '',
  'Drops format:',
  '  d[:<enemy>[-<level>][:[<item>][-[<item>]]][:...]',
  '',
  'Enemies and items are specified by removing any non-alphanumeric',
  'characters from their name. Enemies with the same name can be dis-',
  'ambiguated by specifying their level.',
  '',
  'A wildcard character ("*") can be used to replace items for all enemies.',
  '',
  'The global drop table can be edited by specifying "Global" as the enemy',
  'name. Please note that there are 32 items in the global drop table.',
  '',
  'Examples:',
  '  d:Zombie:Cutlass-Bandanna   Zombie drops Cutlass and Bandanna',
  '  d:Slinger:-Orange           Replace Slinger rare drop with orange',
  '  d:MedusaHead-8:             Medusa Head level 8 drops nothing',
  '  d:*:Grapes-Potion           Every enemy drops Grapes and Potion',
  '  d:Global:Apple-Orange-Tart  Replace first 3 items in global drops table',
  '                              with Apple, Orange, and Tart',
  '',
  'Items can be prevented from being randomized to enemy\'s drop table by',
  'prefixing the enemy\'s name with a hyphen ("-"):',
  '  d:-AxeKnight:Stopwatch   Axe Knight never drops Stopwatch',
  '  d:-StoneRose:Medal-Opal  Stone Rose never drops Medal or Opal',
  '',
  'If other randomization options follow a drop, they must also be',
  'separated from the drop with a comma:',
  '  $0 --opt d:Slinger:-Orange,ipt',
].join('\n')

const equipmentHelp = [
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
].join('\n')

const itemsHelp = [
  'Item location randomization can be toggled using the "i" switch. Items',
  'may be placed in specific locations using argument syntax.',
  '',
  'Items format:',
  '  i[:<zone>:<item>[-<index>]:<replacement>][:...]',
  '',
  'Items are specified by removing any non-alphanumeric characters from',
  'their name. If a zone contains multiple occurences of the same item,',
  'it can be disambuated by specifying its index.',
  '',
  'A wildcard character ("*") can be used for the zone and/or the item. When',
  'used as the zone, the replacement will occur in every zone. When used as',
  'the item, every item will be replaced.',
  '',
  'Zone is one of:',
  '  ST0   (Final Stage: Bloodlines)',
  '  ARE   (Colosseum)',
  '  CAT   (Catacombs)',
  '  CHI   (Abandoned Mine)',
  '  DAI   (Royal Chapel)',
  '  LIB   (Long Library)',
  '  NO0   (Marble Gallery)',
  '  NO1   (Outer Wall)',
  '  NO2   (Olrox\'s Quarters)',
  '  NO3   (Castle Entrance)',
  '  NO4   (Underground Caverns)',
  '  NZ0   (Alchemy Laboratory)',
  '  NZ1   (Clock Tower)',
  '  TOP   (Castle Keep)',
  '  RARE  (Reverse Colosseum)',
  '  RCAT  (Floating Catacombs)',
  '  RCHI  (Cave)',
  '  RDAI  (Anti-Chapel)',
  '  RLIB  (Forbidden Library)',
  '  RNO0  (Black Marble Gallery)',
  '  RNO1  (Reverse Outer Wall)',
  '  RNO2  (Death Wing\'s Lair)',
  '  RNO3  (Reverse Entrance)',
  '  RNO4  (Reverse Caverns)',
  '  RNZ0  (Necromancy Laboratory)',
  '  RNZ1  (Reverse Clock Tower)',
  '  RTOP  (Reverse Castle Keep)',
  '',
  'Examples:',
  '  i:ARE:BloodCloak:Banana     Replace Blood Cloak with Banana',
  '  i:NO3:PotRoast:LibraryCard  Replace Pot Roast with Library Card',
  '  i:TOP:Turkey-2:Peanuts      Replace 2nd Turkey with Peanuts',
  '  i:CAT:*:Orange              Replace every item in Catacombs with Orange',
  '  i:*:MannaPrism:Potion       Replace every Manna Prism with Potion',
  '  i:*:*:Grapes                Replace every item with Grapes',
  '',
  'Items can be prevented from being randomized to a map location by',
  'prefixing the zone with a hyphen ("-"):',
  '  i:-RCHI:LifeApple:Mace       Never replace the Cave Life Apple with Mace',
  '  i:-*:*:HeartRefresh-Uncurse  Never replace any tile with a Heart Refresh',
  '                               or Uncurse',
  '',
  'If other randomization options follow an item, they must also be',
  'separated from the item with a comma:',
  '  $0 --opt i:TOP:Turkey-2:Peanuts,dpt',
].join('\n')

const rewardsHelp = [
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
].join('\n')

const relicsHelp = [
  'Relic location randomization can be toggled with the "r" switch, and',
  'custom relic location locks may be specified using argument syntax.',
  '',
  'A relic location lock sets the abilities required to access a relic',
  'location. Each relic location may be guarded by multiple locks, and the',
  'location will be open to the player once they have all abilities',
  'comprising any single lock.',
  '',
  'A location can also specify escape requirements. These are combinations of',
  'abilities, any one of which must be satisified by all progression routes',
  'granting access to the location. This is intended to prevent the player',
  'from accessing an area that they might not have the ability to escape',
  'from. Note that is is possible for the location itself to grant one of the',
  'abilities required to escape from it.',
  '',
  'Relics format:',
  '  r[:[@]<location>[:<ability>[-<ability>...]]'
    + '[+<ability>[-<ability>...]]][:...]',
  '',
  'Relic locations and the abilities they provide are identified by one',
  'letter:',
  '  (' + constants.RELIC.SOUL_OF_BAT + ') Soul of Bat',
  '  (' + constants.RELIC.FIRE_OF_BAT + ') Fire of Bat',
  '  (' + constants.RELIC.ECHO_OF_BAT + ') Echo of Echo',
  '  (' + constants.RELIC.FORCE_OF_ECHO + ') Force of Echo',
  '  (' + constants.RELIC.SOUL_OF_WOLF + ') Soul of Wolf',
  '  (' + constants.RELIC.POWER_OF_WOLF + ') Power of Wolf',
  '  (' + constants.RELIC.SKILL_OF_WOLF + ') Skill of Wolf',
  '  (' + constants.RELIC.FORM_OF_MIST + ') Form of Mist',
  '  (' + constants.RELIC.POWER_OF_MIST + ') Power of Mist',
  '  (' + constants.RELIC.GAS_CLOUD + ') Gas Cloud',
  '  (' + constants.RELIC.CUBE_OF_ZOE + ') Cube of Zoe',
  '  (' + constants.RELIC.SPIRIT_ORB + ') Spirit Orb',
  '  (' + constants.RELIC.GRAVITY_BOOTS + ') Gravity Boots',
  '  (' + constants.RELIC.LEAP_STONE + ') Leap Stone',
  '  (' + constants.RELIC.HOLY_SYMBOL + ') Holy Symbol',
  '  (' + constants.RELIC.FAERIE_SCROLL + ') Faerie Scroll',
  '  (' + constants.RELIC.JEWEL_OF_OPEN + ') Jewel of Open',
  '  (' + constants.RELIC.MERMAN_STATUE + ') Merman Statue',
  '  (' + constants.RELIC.BAT_CARD + ') Bat Card',
  '  (' + constants.RELIC.GHOST_CARD + ') Ghost Card',
  '  (' + constants.RELIC.FAERIE_CARD + ') Faerie Card',
  '  (' + constants.RELIC.DEMON_CARD + ') Demon Card',
  '  (' + constants.RELIC.SWORD_CARD + ') Sword Card',
  '  (' + constants.RELIC.SPRITE_CARD + ') Sprite Card',
  '  (' + constants.RELIC.NOSEDEVIL_CARD + ') Nosedevil Card',
  '  (' + constants.RELIC.HEART_OF_VLAD + ') Heart of Vlad',
  '  (' + constants.RELIC.TOOTH_OF_VLAD + ') Tooth of Vlad',
  '  (' + constants.RELIC.RIB_OF_VLAD + ') Rib of Vlad',
  '  (' + constants.RELIC.RING_OF_VLAD + ') Ring of Vlad',
  '  (' + constants.RELIC.EYE_OF_VLAD + ') Eye of Vlad',
  '  (' + constants.RELIC.SPIKE_BREAKER + ') Spike Breaker',
  '  (' + constants.RELIC.SILVER_RING + ') Silver ring',
  '  (' + constants.RELIC.GOLD_RING + ') Gold ring',
  '  (' + constants.RELIC.HOLY_GLASSES + ') Holy glasses',
  '',
  'Examples:',
  '  r:B:L      Soul of Bat relic location requires only Leap Stone',
  '  r:y:LV-MP  Holy Symbol relic location requires Leap Stone + Gravity',
  '             Boots OR Form of Mist + Power of Mist',
  '',
  'Note that relic location extensions use the name of the item being',
  'replaced as their identifier:',
  '  r:Mormegil:JL-JV  Mormegil location requires Jewel of Open + Leap Stone',
  '                    OR Jewel of Open + Gravity Boots',
  '',
  'Escape requirements follow the ability locks and are separated by a "+":',
  '  r:H:GS+B-LV-MP  Holy Glasses location requires Gold + Silver Rings for',
  '                  access and Soul of Bat, Leap Stone + Gravity Boots, or',
  '                  Mist + Power of Mist for escape.',
  '',
  'Locks for different locations can be specified by separating each',
  'location by a colon:',
  '  r:B:L:y:LV-MP',
  '',
  'Relic locations extension can be specified with the letter "x". Extension',
  'will allow progression to be placed in locations that do not contain',
  'progression in the vanilla game.',
  '',
  'There are three extension modes:',
  '  guarded    Adds Crystal cloak, Mormegil, Dark Blade, and Ring of Arcana',
  '             to the location pool. This is the default extension mode when',
  '             when enabled without an argument.',
  '  spread     Based on guarded, and adds Dragon helm, Shotel, and Staurolite',
  '             to the location pool.',
  '  equipment  Adds remaining equipment tiles to the location pool.',
  '',
  'Extension format:',
  '  x:<mode>',
  '',
  'Examples:',
  '  r:x:guarded    Enables guarded extension mode',
  '  r:x:equipment  Enables equipment extension mode',
  '',
  'Additionally there are items to provide abilities that do not have a',
  'dedicated vanilla location.',
  '  (' + constants.RELIC.THRUST_SWORD + ') Thrust sword',
  '',
  'These ability items can be added to the relic placement logic by',
  'specifying their ability letter:',
  '  r:D:M:D-L  Enable Thrust sword placement and have Form of Mist location',
  '             require a Thrust sword or Leap Stone',
  '',
  'An optional complexity target can specify a set of abilities that are',
  'considered win conditions. A minimum and maximum complexity depth specify',
  'how many relics must be obtained in series to unlock a win condition:',
  '  r:3:LV-MP  Leap Stone + Gravity Boots OR Form of Mist + Power of Mist',
  '             required to complete seed with a minimum depth of .',
  '  r:3-5:SG   Silver + Gold ring required to complete seed with a minimum',
  '             depth of 3 and a maximum depth of 5',
  '',
  'Relics can be placed in an explicit location by prefixing a location with',
  'the "@" symbol. Multiple relics may be specified, however, only one will',
  'be selected for that location at the time of seed generation. Ability',
  'locks and placed relics may be freely mixed in together:',
  '  r:B:L:@B:fe  Soul of Bat location requires Leap Stone and may contain',
  '               either Fire of Bat or Force of Echo',
  '',
  'A placed relic location may also be "empty". To specify an empty location,',
  'include a "0" in the relic list for that location. Note that relic',
  'locations must be extended when allowing a location to be empty:',
  '  r:x:guarded:@B:0    Soul of Bat location is empty',
  '  r:x:guarded:@y:fe0  Holy Symbol location may be empty or contain Fire of',
  '                      Bat or Force of Echo',
  '',
  'Relics may be blocked from being randomized to a location by prefxing it',
  'with a hypen ("-"):',
  '  r:-J:0BLG  Never let Jewel of Open location be empty, or have Soul of',
  '             Bat, Leap Stone, or Gravity Boots',
  '',
  'A relic can be replaced with an arbitrary item by prefixing its ability',
  'with the "=" symbol:',
  '  r:=z:Duplicator  Replace Cube of Zoe with Duplicator',
  '',
  'Placing progression items in vanilla relic locations requires an item in',
  'that zone to be removed. A player may notice a removed item in a zone',
  'and correctly assume that a progression item has been randomized to a',
  'location in that zone. To prevent this leakage of information, the default',
  'behavior of the relic randomizer is to remove at most 3 random items from',
  'every zone containing relics. This behavior can be turned off by including',
  'the string "~r" as an argument:',
  '  r:~r  Disable leak prevention',
  '',
  'If other randomization options follow a lock, they must also be',
  'separated from the lock with a comma:',
  '  $0 --opt r:B:L:y:LG-MP,dpt',
].join('\n')

const writesHelp = [
  'Arbitrary data can be written using the "w" option with argument syntax.',
  '',
  'Write format:',
  '  w:address:value[:address:value[:...]]',
  '',
  'Addresses should be either decimal numbers or "0x"-prefixed hex strings.',
  '',
  'Values are either "0x"-prefixed hex strings or unprefixed hex strings.',
  'Use an unprefixed hex string to specify a string of bytes.',
  'Use a prefixed hex string to specify a number written as little-endian.',
  'The width of the number written is determined by the length of the hex.',
  'To write a character, the hex must be 2 characters. To write a short, the',
  'hex must be 4 characters. To write a word, the hex must be 8 characters.',
  'To write a long, the hex must be 16 characters. A prefixed hex string of',
  'any other character length is erroneous.',
  '',
  'Additionally, random data can be written by specifying a value of "rc" for',
  'a random character (1 byte), "rs" for a random short (2 bytes), "rw" for a',
  'random word (4 bytes), or "rl" for a random long (8 bytes).',
  '',
  'Examples:',
  '  w:0x04c590:0x00                Write the character 0x00 to the address',
  '                                 0x04c590',
  '  w:0x043930c4:0x78b4            Write the value 0x78b4 as a little-endian',
  '                                 short integer to the address 0x043930c4',
  '  w:0x032b08:0x08075180          Write the value 0x08075180 as a little-',
  '                                 endian integer to the address 0x032b08',
  '  w:0x0abb28:0x00:0x0abb2a:0x01  Write the characters 0x00 and 0x01 to the',
  '                                 addresses 0x0abb28 and 0x0abb2a',
  '                                 respectively',
  '  w:0x04389c6c:74657374ff        Write the string 74657374ff to the',
  '                                 address 0x04389c6c',
  '  w:0x04937fb4:rc                Write a random byte to the address',
  '                                 0x04937fb4',
  '  w:0x0456a274:rs                Write 2 random bytes to the address',
  '                                 0x0456a274',
  '  w:0x0456b888:rw                Write 4 random bytes to the address',
  '                                 0x0456b888',
  '  w:0x049f4a98:rl                Write 8 random bytes to the address',
  '                                 0x049f4a98',
  '',
  'If other randomization options follow a write, they must also be separated',
  'from the write with a comma:',
  '  $0 --opt w:0x0abb28:0x00:0x0abb2a:0x01,dpt',
].join('\n')

const tournamentHelp = [
  'Tournament mode applies the following:',
  '- Spoiler log verbosity maximum is 2 (seed and starting equipment).',
  '- The library shop relic is free.',
  '- The clock room statue is always open.',
].join('\n')

const presetHelp = [
  'Presets specify collection of randomization options. A preset is enabled',
  'by using argument syntax.',
  '',
  'Preset format:',
  '  p:<preset>',
  '',
  'This randomizer has several built-in presets:',
].concat(presets.filter(function(preset) {
  return !preset.hidden
}).map(function(preset) {
  return '  ' + preset.id + (preset.id === 'safe' ? ' (default)' : '')
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
]).join('\n')

function presetMetaHelp(preset) {
  const options = preset.options()
  let locations = relics.filter(function(relic) {
    return !relic.extension && relic.ability !== constants.RELIC.THRUST_SWORD
  })
  const extensions = []
  if (typeof(options.relicLocations) === 'object'
      && 'extension' in options.relicLocations) {
    switch (options.relicLocations.extension) {
    case constants.EXTENSION.WANDERER:
      extensions.push(constants.EXTENSION.WANDERER)
      break
    case constants.EXTENSION.TOURIST:
      extensions.push(constants.EXTENSION.TOURIST)  
    case constants.EXTENSION.EQUIPMENT:
      extensions.push(constants.EXTENSION.EQUIPMENT)
    case constants.EXTENSION.SPREAD:
      extensions.push(constants.EXTENSION.SPREAD)
    case constants.EXTENSION.GUARDED:
      extensions.push(constants.EXTENSION.GUARDED)
    }
  }
  const extendedLocations = extension.filter(function(location) {
    return extensions.indexOf(location.extension) !== -1
  })
  locations = locations.concat(extendedLocations)
  locations = locations.map(function(location) {
    let id
    if ('ability' in location) {
      id = location.ability
    } else {
      id = location.name
    }
    return {
      id: id,
      name: location.name,
      ability: location.ability,
    }
  })
  let info = [
    preset.name + ' by ' + preset.author,
    preset.description,
    '',
  ].concat(locations.map(function(location) {
    let label
    if (location.ability) {
      label = '  (' + location.ability + ') ' + location.name.slice(0, 21)
    } else {
      label = '      ' + location.name.slice(0, 21)
    }
    label += Array(28).fill(' ').join('')
    let locks
    let escapes
    if (options.relicLocations[location.id]) {
      locks = options.relicLocations[location.id].filter(function(lock) {
        return lock[0] !== '+'
      })
      escapes = options.relicLocations[location.id].filter(function(lock) {
        return lock[0] === '+'
      }).map(function(lock) {
        return lock.slice(1)
      })
    }
    return label.slice(0, 28) + location.id.replace(/[^a-zA-Z0-9]/g, '') + ':'
      + (locks ? locks.join('-') : '')
      + (escapes && escapes.length ? '+' + escapes.join('-') : '')
  }))
  const keys = Object.getOwnPropertyNames(options.relicLocations)
  const target = keys.filter(function(key) {
    return /^[0-9]+(-[0-9]+)?$/.test(key)
  }).pop()
  if (target) {
    const parts = target.split('-')
    info.push('')
    info.push('  Complexity target: '
              + parts[0] + ' <= depth'
              + (parts.length === 2 ? ' <= ' + parts[1] : ''))
    info.push('  Goals: ' + options.relicLocations[target].join('-'))
  }
  return info.join('\n')
}

let eccEdcCalc
const yargs = require('yargs')
  .strict()
  .usage('$0 [options] [url]')
  .option('in-bin', {
    alias: 'i',
    describe: 'Path to vanilla .bin file',
    conflicts: ['no-seed'],
    type: 'string',
    requiresArg: true,
  })
  .option('out', {
    alias: 'o',
    describe: [
      'If used with `in-bin` option, path to write randomized .bin file, ',
      'otherwise, path to write PPF file',
    ].join(''),
    type: 'string',
    requiresArg: true,
  })
  .option('seed', {
    alias: 's',
    describe: 'Randomization seed',
    type: 'string',
    requiresArg: true,
  })
  .option('options', {
    alias: 'opt',
    describe: 'Randomizations (`--help options`)',
    type: 'string',
    requiresArg: true,
  })
  .option('expect-checksum', {
    alias: 'e',
    describe: 'Verify checksum',
    conflicts: ['no-seed'],
    type: 'string',
    requiresArg: true,
  })
  .option('url', {
    alias: 'u',
    description: 'Print seed url using optional base',
    type: 'string',
  })
  .option('race', {
    alias: 'r',
    describe: 'Same as -uvv',
    type: 'boolean',
  })
  .option('preset', {
    alias: 'p',
    describe: 'Use preset',
    type: 'string',
    requiresArg: true,
  })
  .option('preset-file', {
    alias: 'f',
    describe: 'Use preset file',
    type: 'string',
    requiresArg: true,
    conflicts: ['preset'],
  })
  .option('complexity', {
    alias: 'c',
    describe: 'Shortcut to adjust seed complexity',
    type: 'number',
    requiresArg: true,
  })
  .option('tournament', {
    alias: 't',
    describe: 'Enable tournament mode (`--help tournament`)',
    type: 'boolean',
  })
  .option('colorrando', {
    alias: 'l',
    describe: 'Enable color palette randomizing for various things',
    type: 'boolean',
  })
  .option('magicmax', {
    alias: 'x',
    describe: 'Enable replace Heart Max with Magic Max Vessels',
    type: 'boolean',
  })
  .option('antifreeze', {
    alias: 'z',
    describe: 'Enable Anti-Freeze Mode, removes screen freezes from level-up & more.',
    type: 'boolean',
  })
  .option('mypurse', {
    alias: 'y',
    describe: 'Prevents Death from stealing your belongings.',
    type: 'boolean',
  })
  .option('mapcolor', {
    alias: 'm',
    describe: 'Change map color',
    type: 'string',
    requiresArg: true,
  })
  .option('disable-accessibility-patches', {
    alias: 'a',
    describe: 'Disable accessibility patches',
    type: 'boolean',
  })
  .option('no-seed', {
    alias: 'n',
    describe: 'Disable seed generation',
    conflicts: ['in-bin', 'expect-checksum'],
    type: 'boolean',
  })
  .option('verbose', {
    alias: 'v',
    describe: 'Verbosity level',
    type: 'count',
    default: undefined,
  })
  .option('quiet', {
    alias: 'q',
    describe: 'Suppress output',
    conflicts: 'verbose',
    type: 'boolean',
  })
  .option('compat', {
    type: 'string',
    requiresArg: true,
  })
  .hide('compat')
  .help(false)
  .option('help', {
    alias: 'h',
    describe: 'Show help',
    type: 'string',
  })
  .demandCommand(0, 1)
const argv = yargs.argv
let options
let seed
let baseUrl
let expectChecksum
let haveChecksum
// Require at least one argument.
if (process.argv.length < 3) {
  yargs.showHelp()
  console.error('\nAt least 1 argument or option required')
  process.exit(1)
}
// Check for help.
if ('help' in argv) {
  if (!argv.help) {
    yargs.showHelp()
    process.exit()
  }
  const topics = {
    options: optionsHelp,
    drops: dropsHelp,
    equipment: equipmentHelp,
    items: itemsHelp,
    rewards: rewardsHelp,
    relics: relicsHelp,
    writes: writesHelp,
    tournament: tournamentHelp,
    preset: presetHelp,
  }
  const script = path.basename(process.argv[1])
  Object.getOwnPropertyNames(topics).forEach(function(topic) {
    topics[topic] = topics[topic].replace(/\$0/g, script)
  }, {})
  presets.forEach(function(preset) {
    if (!preset.hidden) {
      topics[preset.id] = presetMetaHelp(preset)
    }
  })
  if (argv.help in topics) {
    console.log(topics[argv.help])
    process.exit()
  } else {
    yargs.showHelp()
    console.error('\nUnknown help topic: ' + argv.help)
    process.exit(1)
  }
}
if (argv.compat) {
  version = argv.compat
}
// Check for seed string.
if ('seed' in argv) {
  if ('noSeed' in argv) {
    yargs.showHelp()
    console.error('\nCannot specify seed if seed generation is disabled')
    process.exit(1)
  }
  seed = argv.seed.toString()
}
// Check for base url.
if (argv.url) {
  baseUrl = argv.url
}
// If seed generation is disabled, assume url output.
if (argv.noSeed) {
  argv.url = ''
}
// Check for expected checksum.
if ('expectChecksum' in argv) {
  if (!('seed' in argv) && !argv._[0]) {
    yargs.showHelp()
    console.error('\nCannot specify checksum if not providing seed')
    process.exit(1)
  }
  if (!argv.expectChecksum.match(/^[0-9a-f]{1,3}$/)) {
    yargs.showHelp()
    console.error('\nInvalid checksum string')
    process.exit(1)
  }
  expectChecksum = parseInt(argv.expectChecksum, 16)
  haveChecksum = true
}
// Check for randomization string.
if ('options' in argv) {
  try {
    options = util.optionsFromString(argv.options)
  } catch (e) {
    yargs.showHelp()
    console.error('\n' + e.message)
    process.exit(1)
  }
}
// Check for preset.
if ('preset' in argv) {
  try {
    if (options && 'preset' in options && options.preset !== argv.preset) {
      throw new Error('Command line option preset conflits with options '
                      + 'string preset')
    }
    options = Object.assign(
      options || {},
      util.optionsFromString('p:' + argv.preset)
    )
  } catch (e) {
    yargs.showHelp()
    console.error('\n' + e.message)
    process.exit(1)
  }
}
// Check for preset file.
if ('presetFile' in argv) {
  if (options && 'preset' in options) {
    yargs.showHelp()
    console.error('\nCannot specify options string preset when using a preset '
                  + 'file')
    process.exit(1)
  }
  const relative = path.relative(path.dirname(__filename), argv.presetFile)
  const preset = require('./' + relative)
  options = Object.assign(
    options || {},
    util.PresetBuilder.fromJSON(preset).build().options()
  )
}
// If a preset and an options string are specified, determine if the options
// are just duplicate options of the preset.
if (options && 'preset' in options
    && Object.getOwnPropertyNames(options).length > 1) {
  try {
    const applied = util.Preset.options(options)
    const preset = util.presetFromName(options.preset)
    if (util.optionsToString(preset.options())
        === util.optionsToString(applied)) {
      // Options string has duplicative values, so just make the options
      // specifying the preset name.
      options = {preset: preset.id}
    } else {
      // Options string overrides the preset, so use the applied options.
      options = applied
    }
  } catch (err) {
    yargs.showHelp()
    console.error('\n' + err.message)
    process.exit(1)
  }
}
// Assume safe if negations are specified without a preset.
if (options) {
  const copy = Object.assign({}, options)
  Object.getOwnPropertyNames(copy).forEach(function(opt) {
    if (copy[opt] === false) {
      delete copy[opt]
    }
  })
  if (Object.getOwnPropertyNames(copy).length === 0) {
    options.preset = 'safe'
  }
}

// Check for seed url.
if (argv._[0]) {
  if ('noSeed' in argv) {
    yargs.showHelp()
    console.error('\nCannot specify url if seed generation is disabled')
    process.exit(1)
  }
  if ('presetFile' in argv) {
    yargs.showHelp()
    console.error('\nCannot specify url if using a preset file')
    process.exit(1)
  }
  let url
  try {
    url = util.optionsFromUrl(argv._[0])
    argv.race = true
    options = url.options
    seed = url.seed
    expectChecksum = url.checksum
    if (expectChecksum) {
      haveChecksum = true
    }
  } catch (e) {
    yargs.showHelp()
    console.error('\nInvalid url')
    process.exit(1)
  }
  if (seed === null) {
    yargs.showHelp()
    console.error('\nUrl does not contain seed')
    process.exit(1)
  }
  // Ensure seeds match if given using --seed.
  if ('seed' in argv && argv.seed.toString() !== seed) {
    yargs.showHelp()
    console.error('\nArgument seed is not url seed')
    process.exit(1)
  }
  // Ensure randomizations match if given using --options.
  const optionStr = util.optionsToString(options)
  if (('options' in argv && argv.options !== optionStr)
      || ('preset' in argv && 'p:' + argv.preset !== optionStr)) {
    yargs.showHelp()
    console.error('\nArgument randomizations are not url randomizations')
    process.exit(1)
  }
  // Ensure checksum match if given using --expect-checksum.
  if ('expectChecksum' in argv && url.checksum != expectChecksum) {
    yargs.showHelp()
    console.error('\nArgument checksum is not url checksum')
    process.exit(1)
  }
}
// Set options for --race.
if (argv.race) {
  argv.url = ''
  if (argv.verbose === undefined) {
    argv.verbose = 2
  }
}
// Suppress output if quiet argument specified.
if (argv.quiet) {
  argv.verbose = 0
}
// Create default options if none provided.
if (typeof(seed) === 'undefined' && !argv.noSeed) {
  seed = (new Date()).getTime().toString()
}
if (!options) {
  options = util.optionsFromString(constants.defaultOptions)
}
// Check for complexity setting.
if ('complexity' in argv) {
  let applied = Object.assign({}, options)
  // Check for preset.
  if ('preset' in applied) {
    applied = util.Preset.options(applied)
  } else if (!('relicLocations' in options)) {
    appield = util.Preset.options(Object.assign({preset: 'safe'}, options))
  }
  if (typeof applied.relicLocations !== 'object') {
    if (applied.relicLocations) {
      // Inherit safe relic locations.
      const logic = util.presetFromName('safe').options().relicLocations
      applied.relicLocations = logic
    } else {
      yargs.showHelp()
      console.error('\nRelic location randomization must be enabled to set ' +
                    'complexity')
      process.exit(1)
    }
  }
  // Get seed goals.
  let complexity = Object.getOwnPropertyNames(applied.relicLocations).filter(
    function(key) {
      return /^[0-9]+$/.test(key)
    }
  )
  if (complexity.length) {
    complexity = complexity.pop()
    if (parseInt(complexity) !== argv.complexity) {
      const goals = applied.relicLocations[complexity]
      delete applied.relicLocations[complexity]
      applied.relicLocations[argv.complexity] = goals
      options = applied
    }
  } else {
    yargs.showHelp()
    console.error('\nCompletion goals must be preset to set complexity')
    process.exit(1)
  }
}
// Enable tournament mode if specified.
if (argv.tournament) {
  options.tournamentMode = true
}
// Enable color rando mode if specified. - MottZilla
if (argv.colorrando) { // Enable Color Randomizations
  options.colorrandoMode = true
}
// Enable magic max mode if specified. - MottZilla
if (argv.magicmax) { // Adds MP Vessel to replace Heart Vessel - eldrich
  options.magicmaxMode = true
}
// Enable anti-freeze mode if specified. - eldri7ch
if (argv.antifreeze) { // Removes screen freezes from level-up and acquisitions - eldrich
  options.antiFreezeMode = true
}
// Enable my purse mode if specified. - eldri7ch
if (argv.mypurse) { // Adds MP Vessel to replace Heart Vessel - eldrich
  options.mypurseMode = true
}
// Map Color Features if specified. - eldri7ch
if ('mapcolor' in argv && typeof(argv.mapcolor) !== 'undefined') {
  let termsAllowed = 'u,r,b,g,y,p,k'
  if (!(termsAllowed.includes(argv.mapcolor))) {
    yargs.showHelp()
    console.error('\nMust contain a letter \'u\'(Blue), \'r\'(Crimson), \'b\'(Brown), \'g\'(Green), \'y\'(Gray), \'p\'(Purple), \'k\'(Pink)')
    process.exit(1)
  } else {
    options.mapcolorTheme = argv.mapcolor.toString()
  }
}
// Set misc options.
if ('verbose' in argv) {
  options.verbose = argv.verbose
}
const info = util.newInfo()
// Add seed to log info if not provided through command line.
if (!argv.noSeed && (!('url' in argv) || argv._[0])) {
  info[1]['Seed'] = seed
}
let fd
let size
// Read bin file if provided.
if ('inBin' in argv) {
  eccEdcCalc = require('./src/ecc-edc-recalc-js')
  let digest
  if (!('out' in argv)) {
    fd = fs.openSync(argv.inBin, 'r+')
    size = fs.fstatSync(fd).size
    const bin = Buffer.alloc(size)
    fs.readSync(fd, bin, 0, size)
    digest = crypto.createHash('sha256').update(bin).digest()
  } else {
    fd = fs.readFileSync(argv.inBin)
    size = fd.length
    digest = crypto.createHash('sha256').update(fd).digest()
  }
  if (digest.toString('hex') !== constants.digest) {
    console.error('Error: Disc image is not a valid or vanilla backup.')
    process.exit(1)
  }
}

(async function randomize() {
  try {
    let check
    let checksum
    if (!argv.noSeed) {
      check = new util.checked(typeof(fd) === 'object' ? undefined : fd)
      let applied
      try {
        // Check for overriding preset.
        let override
        for (let preset of presets) {
          if (preset.override) {
            applied = preset.options()
            override = true
            break
          }
        }
        // Get user specified options.
        if (!override) {
          applied = util.Preset.options(options)
        }
      } catch (err) {
        yargs.showHelp()
        console.error('\n' + err.message)
        process.exit(1)
      }
      try {
        let rng
        let result
        // Randomize stats.
        rng = new require('seedrandom')(util.saltSeed(
          version,
          options,
          seed,
          0,
        ))
        result = randomizeStats(rng, applied)
        const newNames = result.newNames
        check.apply(result.data)
        // Randomize relics.
        const cores = os.cpus().length
        const workers = Array(util.workerCountFromCores(cores))
        for (let i = 0; i < workers.length; i++) {
          workers[i] = new Worker('./src/worker.js')
        }
        result = await util.randomizeRelics(
          version,
          applied,
          options,
          seed,
          newNames,
          workers,
          4,
        )
        util.mergeInfo(info, result.info)
        // Write relics mapping.
        rng = new require('seedrandom')(util.saltSeed(
          version,
          options,
          seed,
          1,
        ))
        result = randomizeRelics.writeRelics(
          rng,
          applied,
          result,
          newNames,
        )
        check.apply(result.data)
        // Randomize items.
        result = await util.randomizeItems(
          version,
          applied,
          options,
          seed,
          new Worker('./src/worker.js'),
          2,
          result.items,
          newNames,
        )
        check.apply(result.data)
        util.mergeInfo(info, result.info)
        // Randomize music.
        rng = new require('seedrandom')(util.saltSeed(
          version,
          options,
          seed,
          3,
        ))
        check.apply(randomizeMusic(rng, applied))
        if (options.tournamentMode) {
          // Apply tournament mode patches.
          check.apply(util.applyTournamentModePatches())
        }
        if (options.magicmaxMode || applied.magicmaxMode) { // Adds MP Vessel to replace Heart Vessel - eldrich
          // Apply magic max mode patches. - MottZilla
          check.apply(util.applyMagicMaxPatches())
        }
        if (options.antiFreezeMode || applied.antiFreezeMode) { // Removes screen freezes on relic / vessel collection and level-up - eldrich
          // Apply anti-freeze mode patches. - eldri7ch
          check.apply(util.applyAntiFreezePatches())
        }
        if (options.mypurseMode || applied.mypurseMode) { // Removes Death from Entrance - eldrich
          // Apply Death repellant patches. - eldri7ch
          check.apply(util.applyMyPursePatches())
        }
        if ('mapcolor' in argv) { // Colors the map - eldrich
          // Apply map color patches. - eldri7ch
          let mapcol = argv.mapcolor
          check.apply(util.applyMapColor(mapcol))
        }
        // Apply writes.
        check.apply(util.applyWrites(rng, applied))
      } catch (err) {
        console.error('Seed: ' + seed)
        if (errors.isError(err)) {
          console.error('Error: ' + err.message)
        } else {
          console.error(err.stack)
        }
        process.exit(1)
      }
      util.setSeedText(
        check,
        seed,
        version,
        options.preset,
        options.tournamentMode,
      )
      checksum = await check.sum()
      // Verify expected checksum matches actual checksum.
      if (haveChecksum && expectChecksum !== checksum) {
        console.error('Checksum mismatch.')
        process.exit(1)
      }
    }
    if (!argv.disableAccessibilityPatches) {
      // Apply accessibility patches.
      check.apply(applyAccessibilityPatches())
    }
    // Show url if not provided as arg.
    if ('url' in argv && !argv._[0] && !argv.quiet) {
      console.log(util.optionsToUrl(
        version,
        options,
        checksum || '',
        seed || '',
        baseUrl,
      ))
    }
    // Print spoilers.
    if (argv.verbose > 0) {
      let verbose = argv.verbose
      if (options.tournamentMode && argv.verbose >= 2) {
        verbose = 2
      }
      const text = util.formatInfo(info, verbose)
      if (text.length) {
        console.log(text)
      }
    }
    if (!argv.noSeed) {
      if ('out' in argv) {
        if ('inBin' in argv) {
          // If is not an in-place randomization, apply writes to the buffer
          // containing the disc image bytes.
          const writer = new util.checked(fd)
          writer.apply(check)
        } else {
          // Otherwise, write patch file.
          const patch = check.toPatch(
            seed,
            options.preset,
            options.tournamentMode,
          )
          fs.writeFileSync(argv.out, patch)
        }
      }
      // Write error detection codes.
      if (fd) {
        eccEdcCalc(fd, size, true)
      }
      // Write randomized bin.
      if (typeof(fd) === 'object') {
        fs.writeFileSync(argv.out, fd)
      }
    }
  } finally {
    if (typeof(fd) === 'number') {
      fs.closeSync(fd)
    }
  }
})()

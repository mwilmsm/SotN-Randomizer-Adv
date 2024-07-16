#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import seedrandom from 'seedrandom';
import { Worker } from 'worker_threads';
import yargsFn from 'yargs/yargs';
import presets from './build/presets/index.mjs';
import yargsOptions from './opts.mjs';
import * as pkg from './package.json' with { type: 'json' };
import * as applyAccessibilityPatches from './src/accessibility_patches.mjs';
import * as constants from './src/constants.mjs';
import eccEdcCalc from './src/ecc-edc-recalc-js.mjs';
import * as errors from './src/errors.mjs';
import * as extension from './src/extension.mjs';
import * as randomizeMusic from './src/randomize_music.mjs';
import * as randomizeRelics from './src/randomize_relics.mjs';
import * as randomizeStats from './src/randomize_stats.mjs';
import * as relics from './src/relics.mjs';
import * as util from './src/util.mjs';
import { dropsHelp } from './tools/help/dropsHelp.mjs';
import { equipmentHelp } from './tools/help/equipmentHelp.mjs';
import { itemsHelp } from './tools/help/itemsHelp.mjs';
import { optionsHelp } from './tools/help/optionsHelp.mjs';
import { presetHelp } from './tools/help/presetHelp.mjs';
import { rewardsHelp } from './tools/help/rewardsHelp.mjs';
import { writesHelp } from './tools/help/writesHelp.mjs';
import Preset from './src/Preset.mjs';
import { PresetBuilder } from './src/PresetBuilder.mjs';

const version = pkg.version;

Error.stackTraceLimit = Infinity;

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
              + (parts.length === 2 ? ' <= ' + parts[1] : ''));
    info.push('  Goals: ' + options.relicLocations[target].join('-'))
  }
  return info.join('\n')
}

const yargs = yargsFn(process.argv.slice(2)).strict().usage('$0 [options] [url]')
.options(yargsOptions)
  .hide('compat')
  .help(false)
  .option('help', {
    alias: 'h',
    describe: 'Show help',
    type: 'string',
  })
  .demandCommand(0, 1);
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
  handleHelpArg();
}
if (argv.compat) {
  version = argv.compat
}
// Check for seed string.
if ('seed' in argv) {
  handleSeedArg();
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
  handleExpectChecksumArg();
}
// Check for randomization string.
if ('options' in argv) {
  handleOptionsArg();
}
// Check for preset.
if ('preset' in argv) {
  handlePresetArg();
}
// Check for preset file.
if ('presetFile' in argv) {
  await handlePresetFileArg();
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
    yargsFn().showHelp()
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
if (argv._[0]) {``
  if ('noSeed' in argv) {
    yargsFn().showHelp()
    console.error('\nCannot specify url if seed generation is disabled')
    process.exit(1)
  }
  if ('presetFile' in argv) {
    yargsFn().showHelp()
    console.error('\nCannot specify url if using a preset file')
    process.exit(1)
  }
  let url
  try {
    console.log(JSON.stringify(argv, null, 2));
    url = util.optionsFromUrl(argv._[0]);
    argv.race = true;
    options = url.options;
    seed = url.seed;
    expectChecksum = url.checksum;
    if (expectChecksum) {
      haveChecksum = true;
    }
  } catch (e) {
    yargsFn().showHelp()
    console.error('\nInvalid url')
    process.exit(1)
  }
  if (seed === null) {
    yargsFn().showHelp()
    console.error('\nUrl does not contain seed')
    process.exit(1)
  }
  // Ensure seeds match if given using --seed.
  if ('seed' in argv && argv.seed.toString() !== seed) {
    yargsFn().showHelp()
    console.error('\nArgument seed is not url seed')
    process.exit(1)
  }
  // Ensure randomizations match if given using --options.
  const optionStr = util.optionsToString(options)
  if (('options' in argv && argv.options !== optionStr)
      || ('preset' in argv && 'p:' + argv.preset !== optionStr)) {
    yargsFn().showHelp()
    console.error('\nArgument randomizations are not url randomizations')
    process.exit(1)
  }
  // Ensure checksum match if given using --expect-checksum.
  if ('expectChecksum' in argv && url.checksum != expectChecksum) {
    yargsFn().showHelp()
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
  handleComplexityArg();
}
// Enable tournament mode if specified.
  options.tournamentMode = argv.tournament;
// Enable color rando mode if specified. - MottZilla
// Enable Color Randomizations
  options.colorrandoMode = argv.colorrando;
// Enable magic max mode if specified. - MottZilla
// Adds MP Vessel to replace Heart Vessel - eldrich
  options.magicmaxMode = argv.magicmax;
// Enable anti-freeze mode if specified. - eldri7ch
 // Removes screen freezes from level-up and acquisitions - eldrich
  options.antiFreezeMode = argv.antifreeze;
// Enable my purse mode if specified. - eldri7ch
// Adds MP Vessel to replace Heart Vessel - eldrich
  options.mypurseMode = argv.mypurse;

// Map Color Features if specified. - eldri7ch
if ('mapcolor' in argv && typeof(argv.mapcolor) !== 'undefined') {
  let termsAllowed = 'u,r,b,g,y,p,k'
  if (!(termsAllowed.includes(argv.mapcolor))) {
    yargsFn().showHelp()
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

async function randomize() {
  try {
    let check;
    let checksum;
    if (!argv.noSeed) {
      check = new util.checked(typeof(fd) === 'object' ? undefined : fd)
      let applied;
      try {
        // Check for overriding preset.
        let override;
        for (let preset of presets) {
          if (preset.override) {
            applied = preset.options();
            override = true;
            break;
          }
        }
        // Get user specified options.
        if (!override) {
          console.log("options", options);
          applied = Preset.prototype.options(options);
        }
      } catch (err) {
        console.log(err);
        yargsFn().showHelp();
        console.error('\n' + err.message);
        process.exit(1);
      }
      try {
        let rng
        let result
        // Randomize stats.
        rng = new seedrandom(util.saltSeed(
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
        rng = new seedrandom(util.saltSeed(
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
        rng = new seedrandom(util.saltSeed(
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
}

function handleComplexityArg() {
  let applied = Object.assign({}, options);
  // Check for preset.
  if ('preset' in applied) {
    applied = util.Preset.options(applied);
  } else if (!('relicLocations' in options)) {
    appield = util.Preset.options(Object.assign({ preset: 'safe' }, options));
  }
  if (typeof applied.relicLocations !== 'object') {
    if (applied.relicLocations) {
      // Inherit safe relic locations.
      const logic = util.presetFromName('safe').options().relicLocations;
      applied.relicLocations = logic;
    } else {
      yargsFn().showHelp();
      console.error('\nRelic location randomization must be enabled to set ' +
        'complexity');
      process.exit(1);
    }
  }
  // Get seed goals.
  let complexity = Object.getOwnPropertyNames(applied.relicLocations).filter(
    function (key) {
      return /^[0-9]+$/.test(key);
    }
  );
  if (complexity.length) {
    complexity = complexity.pop();
    if (parseInt(complexity) !== argv.complexity) {
      const goals = applied.relicLocations[complexity];
      delete applied.relicLocations[complexity];
      applied.relicLocations[argv.complexity] = goals;
      options = applied;
    }
  } else {
    yargsFn().showHelp();
    console.error('\nCompletion goals must be preset to set complexity');
    process.exit(1);
  }
}

async function handlePresetFileArg() {
  if (options && 'preset' in options) {
    yargsFn().showHelp();
    console.error('\nCannot specify options string preset when using a preset file');
    process.exit(1);
  }
  const relative = path.relative(path.dirname(__filename), argv.presetFile);
  const preset = await import('./' + relative);
  options = Object.assign(
    options || {},
    util.PresetBuilder.fromJSON(preset).build().options()
  );
}

function handlePresetArg() {
  try {
    if (options && 'preset' in options && options.preset !== argv.preset) {
      throw new Error('Command line option preset conflits with options '
        + 'string preset');
    }
    options = Object.assign(
      options || {},
      util.optionsFromString('p:' + argv.preset)
    );
  } catch (e) {
    yargsFn().showHelp();
    console.error('\n' + e.message);
    process.exit(1);
  }
}

function handleOptionsArg() {
  try {
    options = util.optionsFromString(argv.options);
  } catch (e) {
    yargsFn().showHelp();
    console.error('\n' + e.message);
    process.exit(1);
  }
}

function handleExpectChecksumArg() {
  if (!('seed' in argv) && !argv._[0]) {
    yargsFn().showHelp();
    console.error('\nCannot specify checksum if not providing seed');
    process.exit(1);
  }
  if (!argv.expectChecksum.match(/^[0-9a-f]{1,3}$/)) {
    yargsFn().showHelp();
    console.error('\nInvalid checksum string');
    process.exit(1);
  }
  expectChecksum = parseInt(argv.expectChecksum, 16);
  haveChecksum = true;
}

function handleSeedArg() {
  if ('noSeed' in argv) {
    yargsFn().showHelp();
    console.error('\nCannot specify seed if seed generation is disabled');
    process.exit(1);
  }
  seed = argv.seed.toString();
}

function handleHelpArg() {
  if (!argv.help) {
    yargs.showHelp();
    process.exit();
  }
  const topics = {
    options: optionsHelp,
    drops: dropsHelp,
    equipment: equipmentHelp,
    items: itemsHelp,
    rewards: rewardsHelp,
    relics: relicsHelp,
    writes: writesHelp,
    tournament:  'Tournament mode applies the following:\n' + 
    '- Spoiler log verbosity maximum is 2 (seed and starting equipment).\n' +
    '- The library shop relic is free.\n' +
    '- The clock room statue is always open.',
    preset: presetHelp,
  };
  const script = path.basename(process.argv[1]);
  Object.getOwnPropertyNames(topics).forEach(function (topic) {
    topics[topic] = topics[topic].replace(/\$0/g, script);
  }, {});
  presets.forEach(function (preset) {
    if (!preset.hidden) {
      topics[preset.id] = presetMetaHelp(preset);
    }
  });
  if (argv.help in topics) {
    console.log(topics[argv.help]);
    process.exit();
  } else {
    yargsFn().showHelp();
    console.error('\nUnknown help topic: ' + argv.help);
    process.exit(1);
  }
}

await randomize();
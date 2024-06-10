#!/usr/bin/env node
// This tool generates a JavaScript module from a preset serialized in JSON.
// Usage: tools/build-presets [preset-name]

import { runner } from 'hygen';
import presets from '../src/presets.js';

process.env.HYGEN_OVERWRITE = 1

presets.forEach(function(name) {
  runner(['preset', 'new', '--name', name], {
    templates: '../templates',
    cwd: process.cwd(),
    logger: {
      ok: console.log.bind(console),
      log: console.log.bind(console),
    },
    createPrompter: function() {},
  })
})

#!/usr/bin/env node
// This tool generates a JavaScript module from a preset serialized in JSON.
// Usage: tools/build-presets [preset-name]

import { runner } from 'hygen';
import presets from '../src/presets.mjs';

process.env.HYGEN_OVERWRITE = 1
Error.stackTraceLimit = Infinity;

// presets.forEach((name) => {
  const name = "adventure";
  console.log("name", name);
  runner(['preset', 'new', name], {
    templates: '../templates',
    cwd: process.cwd(),
    logger: {
      ok: console.log.bind(console),
      log: console.log.bind(console),
    },
    createPrompter: function() {},
    debug: true,
  });
// });

#!/usr/bin/env node
// This tool generates a JavaScript module from a preset serialized in JSON.
// Usage: tools/build-presets [preset-name]

import { runner } from 'hygen';
import path from 'path';
import { fileURLToPath } from 'url';
import presets from '../src/presets.mjs';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

process.env.HYGEN_OVERWRITE = 1
Error.stackTraceLimit = Infinity;

presets.forEach((name) => {
  console.log("name", name);
  runner(['preset', 'new', name], {
    templates: path.join(__dirname, '../templates'),
    cwd: process.cwd(),
    logger: {
      ok: console.log.bind(console),
      log: console.log.bind(console),
    },
    createPrompter: function () { },
    debug: true,
  });
});

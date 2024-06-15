// This is a generated file. Do not edit it directly.
// Make your changes to presets/safe.json then rebuild
// this file with `npm run build-presets -- safe`.

  // Boilerplate.
  import { PresetBuilder } from '../../src/PresetBuilder.mjs';

  // Create PresetBuilder.
  const builder = PresetBuilder.fromJSON({"metadata":{"id":"safe","name":"Safe","description":"Requires no speedrun or glitch knowledge for completion.","author":"3snow_p7im, setz, and soba","weight":1750},"inherits":"casual","colorrandoMode":true,"complexityGoal":{"min":9,"goals":["Holy glasses + Heart of Vlad + Tooth of Vlad + Rib of Vlad + Ring of Vlad + Eye of Vlad"]}})

  // Export.
  const safe = builder.build()

  export default safe;
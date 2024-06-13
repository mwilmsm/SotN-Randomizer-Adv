// This is a generated file. Do not edit it directly.
// Make your changes to presets/stwosafe.json then rebuild
// this file with `npm run build-presets -- stwosafe`.

  // Boilerplate.
  import {PresetBuilder} from '../../src/util.mjs';

  // Create PresetBuilder.
  const builder = PresetBuilder.fromJSON({"metadata":{"id":"stwosafe","name":"Safe Season 2","description":"Emulates how safe felt in Season 2. Requires no speedrun or glitch knowledge for completion.","author":"3snow_p7im, setz, and soba","weight":2300},"inherits":"casual","stats":false,"complexityGoal":{"min":8,"goals":["Holy glasses + Heart of Vlad + Tooth of Vlad + Rib of Vlad + Ring of Vlad + Eye of Vlad"]}})

  // Export.
  const stwosafe = builder.build()

  export default stwosafe;
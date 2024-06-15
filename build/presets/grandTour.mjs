// This is a generated file. Do not edit it directly.
// Make your changes to presets/grandTour.json then rebuild
// this file with `npm run build-presets -- grandTour`.

  // Boilerplate.
  import { PresetBuilder } from '../../src/PresetBuilder.mjs';

  // Create PresetBuilder.
  const builder = PresetBuilder.fromJSON({"metadata":{"id":"grandTour","name":"Grand Tour","description":"Encourages sight-seeing","author":"eldri7ch & Mottzilla","weight":0},"inherits":"casual","relicLocationsExtension":"tourist","colorrandoMode":true,"music":false,"complexityGoal":{"min":8,"goals":["Holy glasses + Heart of Vlad + Tooth of Vlad + Rib of Vlad + Ring of Vlad + Eye of Vlad"]}})

  // Export.
  const grandTour = builder.build()

  export default grandTour;
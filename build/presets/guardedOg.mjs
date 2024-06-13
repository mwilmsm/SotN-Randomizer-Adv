// This is a generated file. Do not edit it directly.
// Make your changes to presets/guardedOg.json then rebuild
// this file with `npm run build-presets -- guardedOg`.

  // Boilerplate.
  import {PresetBuilder} from '../../src/util.mjs';

  // Create PresetBuilder.
  const builder = PresetBuilder.fromJSON({"metadata":{"id":"guardedOg","name":"Guarded O.G.","description":"Simulates randomizer season 1, but adds additional guarded locations. No stat randomization. Gold ring, Silver ring, Holy glasses and Spike Breaker are in vanilla locations.","author":"TalicZealot","weight":250},"inherits":"casual","preventLeaks":false,"stats":false,"music":false,"placeRelic":[{"location":"Silver ring","relic":"Silver ring"},{"location":"Gold ring","relic":"Gold ring"},{"location":"Holy glasses","relic":"Holy glasses"},{"location":"Spike Breaker","relic":"Spike Breaker"}]})

  // Export.
  const guardedOg = builder.build()

  export default guardedOg;
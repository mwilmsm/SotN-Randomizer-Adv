// This is a generated file. Do not edit it directly.
// Make your changes to presets/scavenger.json then rebuild
// this file with `npm run build-presets -- scavenger`.

  // Boilerplate.
  import { PresetBuilder } from '../../src/PresetBuilder.mjs';

  // Create PresetBuilder.
  const builder = PresetBuilder.fromJSON({"metadata":{"id":"scavenger","name":"Scavenger","description":"No enemy drops challenge mode.","author":"3snow_p7im","weight":2250},"inherits":"safe","colorrandoMode":true,"enemyDrops":[{"enemy":"*","items":[null,null]},{"enemy":"Global","items":["Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart"]}],"placeRelic":[{"location":"Jewel of Open","relic":["Fire of Bat","Force of Echo","Power of Wolf","Skill of Wolf","Gas Cloud","Cube of Zoe","Spirit Orb","Holy Symbol","Faerie Scroll","Bat Card","Ghost Card","Faerie Card","Demon Card","Sword Card","Sprite Card","Nosedevil Card",null]}]})

  // Export.
  const scavenger = builder.build()

  export default scavenger;
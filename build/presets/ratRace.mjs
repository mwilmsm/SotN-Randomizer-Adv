// This is a generated file. Do not edit it directly.
// Make your changes to presets/ratRace.json then rebuild
// this file with `npm run build-presets -- ratRace`.

  // Boilerplate.
  import { PresetBuilder } from '../../src/PresetBuilder.mjs';

  // Create PresetBuilder.
  const builder = PresetBuilder.fromJSON({"metadata":{"id":"ratRace","name":"Rat race","description":"Just trying to make a buck. Released on April 1st, 2023.","author":"3snow_p7im","weight":1500},"inherits":"safe","stats":false,"complexityGoal":{"min":9,"goals":["Spirit Orb"]},"replaceRelic":[{"relic":"Spirit Orb","item":"Zircon"}],"placeRelic":[{"location":"Jewel of Open","relic":["Heart of Vlad","Tooth of Vlad","Rib of Vlad","Ring of Vlad","Eye of Vlad"]}],"blockDrops":[{"enemy":"*","items":["$1","$25","$50","$100","$250","$400","$1000","$2000","Zircon","Aquamarine","Turquoise","Onyx","Garnet","Opal","Diamond","Jewel sword","Library card"]}],"blockItems":[{"zone":"*","item":"*","replacement":["$1","$25","$50","$100","$250","$400","$1000","$2000","Zircon","Aquamarine","Turquoise","Onyx","Garnet","Opal","Diamond","Jewel sword","Library card"]}],"blockEquipment":[{"slot":"Right hand","item":"Jewel sword"},{"slot":"Other","item":["Zircon","Aquamarine","Turquoise","Onyx","Garnet","Opal","Diamond"]}],"blockRewards":[{"item":"Heart Refresh","replacement":"Library card"},{"item":"Neutron bomb","replacement":"Library card"},{"item":"Potion","replacement":"Library card"}],"enemyDrops":[{"enemy":"Global","items":["Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Heart","Big heart","Big heart","Heart","Heart","Heart","Heart","Heart","Heart"]}],"writes":[{"comment":"Patch shop relic price","type":"word","address":"0x047a3098","value":"0x00000096"},{"comment":"Blank shop menu","address":"0x047a309c","type":"string","value":"0100000000000000"},{"type":"string","value":"0100000000000000"},{"type":"string","value":"0100000000000000"},{"type":"string","value":"0100000000000000"},{"type":"string","value":"0100000000000000"},{"type":"string","value":"0100000000000000"},{"type":"string","value":"0100000000000000"},{"type":"string","value":"0100000000000000"},{"comment":"SOLD OUT","type":"word","address":"0x047dc578","value":"0x34020000"},{"comment":"List length","type":"char","address":"0x047dbe84","value":"0x08"}]})

  // Export.
  const ratRace = builder.build()

  export default ratRace;
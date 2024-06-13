import adventure from './adventure.mjs';
import agonizetwtw from './agonizetwtw.mjs';
import aperture from './aperture.mjs';
import batMaster from './batMaster.mjs';
import beyond from './beyond.mjs';
import bigToss from './bigToss.mjs';
import bossRush from './bossRush.mjs';
import bountyhunter from './bountyhunter.mjs';
import bountyhunterTc from './bountyhunterTc.mjs';
import breach from './breach.mjs';
import casual from './casual.mjs';
import chaosLite from './chaosLite.mjs';
import crashCourse from './crashCourse.mjs';
import emptyHand from './emptyHand.mjs';
import expedition from './expedition.mjs';
import forge from './forge.mjs';
import gemFarmer from './gemFarmer.mjs';
import glitch from './glitch.mjs';
import grandTour from './grandTour.mjs';
import guardedOg from './guardedOg.mjs';
import hitman from './hitman.mjs';
import legDay from './legDay.mjs';
import lookingglass from './lookingglass.mjs';
import lycanthrope from './lycanthrope.mjs';
import magicMirror from './magicMirror.mjs';
import nimble from './nimble.mjs';
import og from './og.mjs';
import open from './open.mjs';
import ratRace from './ratRace.mjs';
import safe from './safe.mjs';
import scavenger from './scavenger.mjs';
import skinwalker from './skinwalker.mjs';
import speedrun from './speedrun.mjs';
import stwosafe from './stwosafe.mjs';
import summoner from './summoner.mjs';
import thirdCastle from './thirdCastle.mjs';
import warlock from './warlock.mjs';

const presets = [
  casual,
  safe,
  adventure,
  og,
  guardedOg,
  speedrun,
  lycanthrope,
  warlock,
  nimble,
  expedition,
  glitch,
  scavenger,
  emptyHand,
  batMaster,
  gemFarmer,
  thirdCastle,
  ratRace,
  magicMirror,
  legDay,
  bossRush,
  aperture,
  bigToss,
  bountyhunter,
  bountyhunterTc,
  hitman,
  chaosLite,
  beyond,
  breach,
  grandTour,
  crashCourse,
  forge,
  lookingglass,
  skinwalker,
  summoner,
  agonizetwtw,
  stwosafe,
  open,
];


presets.sort(function (a, b) {
  if (!('weight' in a && 'id' in a)) {
    if (!('weight' in b && 'id' in b)) {
      return 0
    }
    return 1
  } else if (!('weight' in b && 'id' in b)) {
    return -1
  }
  const weight = a.weight - b.weight
  if (weight === 0) {
    if (a.id < b.id) {
      return -1
    } else if (a.id > b.id) {
      return 1
    }
  }
  return weight
});

export default presets;

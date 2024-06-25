import { clone, merge } from './util.mjs'

export default class Preset {

    constructor(
        id,
        name,
        description,
        author,
        weight,
        hidden,
        override,
        enemyDrops,
        startingEquipment,
        itemLocations,
        prologueRewards,
        relicLocations,
        stats,
        music,
        turkeyMode,
        colorrandoMode,
        magicmaxMode,
        antiFreezeMode,
        mypurseMode,
        mapcolorTheme,
        writes,
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.author = author
        this.weight = weight
        this.hidden = hidden
        this.override = override
        this.enemyDrops = enemyDrops
        this.startingEquipment = startingEquipment
        this.itemLocations = itemLocations
        this.prologueRewards = prologueRewards
        this.relicLocations = relicLocations
        this.stats = stats
        this.music = music
        this.turkeyMode = turkeyMode
        this.colorrandoMode = colorrandoMode
        this.magicmaxMode = magicmaxMode
        this.antiFreezeMode = antiFreezeMode
        this.mypurseMode = mypurseMode
        this.mapcolorTheme = mapcolorTheme
        if (writes) {
            this.writes = writes
        }
    }


    options(options) {
        options = clone(options)
        if (options.preset) {
            let preset = presets.filter(function (preset) {
                return preset.id === options.preset
            }).pop()
            if (!preset && !self) {
                try {
                    preset = prsts[options.preset];
                } catch (err) {
                    if (err.code !== 'MODULE_NOT_FOUND') {
                        console.error(err.stack)
                        throw new Error('Error loading preset: ' + options.preset)
                    }
                }
            }
            if (!preset) {
                throw new Error('Unknown preset: ' + options.preset)
            }
            delete options.preset
            const presetOptions = preset.options()
            merge(presetOptions, options)
            return presetOptions
        }
        return options
    }
    static toString = function toString() {
        return optionsToString.bind(this, this.options())()
    }

}


Preset.prototype.options = function options() {
    const options = Object.assign({}, this)
    delete options.id
    delete options.name
    delete options.description
    delete options.author
    delete options.weight
    delete options.hidden
    delete options.override
    return clone(options)
}
import * as constants from './constants.mjs';
// import presets from '../build/presets/index.mjs';
import Preset from './Preset.mjs';
import {
    assert,
    getEnemyAlias,
    getItemAlias,
    getLocationAlias,
    getRelicAlias, 
    getZoneAlias,
    locksFromArray,
    locationFromName,
    relicFromName
} from './util.mjs';
import items from './items.mjs';
import enemies from './enemies.mjs';
import locations from './extension.mjs';

export class PresetBuilder {

    antifreeze;
    colorrando;
    drops;
    enemyAliases;
    equipment;
    escapes;
    extension;
    goal;
    itemAliases;
    items;
    leakPrevention;
    locationAliases;
    locations;
    magicmax;
    mapcolor;
    metadata;
    music;
    mypurse;
    relicAliases;
    rewards;
    self;
    stats;
    target;
    thrustSword;
    turkey;
    writes;
    zoneAliases;

    static rewardsMap = {
        'Heart Refresh': 'h',
        'Neutron bomb': 'n',
        'Potion': 'p',
    };

    // Helper class to create relic location locks.
    constructor(metadata) {
        this.metadata = metadata
        // Aliases.
        this.zoneAliases = {}
        this.enemyAliases = {}
        this.relicAliases = {}
        this.locationAliases = {}
        this.itemAliases = {}
        // The collection of enemy drops.
        this.drops = true
        // The collection of starting equipment.
        this.equipment = true
        // The collection of item locations.
        this.items = true
        // The collection of prologue rewards.
        this.rewards = true
        // The collection of location locks.
        this.locations = true
        // The collection of escape requirements.
        this.escapes = {}
        // The relic locations extension.
        this.extension = constants.EXTENSION.GUARDED
        // Leak prevention.
        this.leakPrevention = true
        // Thrust sword ability.
        this.thrustSword = false
        // The complexity goal.
        this.target = undefined
        this.goal = undefined
        // Item stats randomization.
        this.stats = true
        // Music randomization.
        this.music = true
        // Turkey mode.
        this.turkey = true
        // Color Palette Rando mode.
        this.colorrando = false
        // Magic Max mode.
        this.magicmax = false
        // AntiFreeze mode.
        this.antifreeze = false
        // That's My Purse mode.
        this.mypurse = false
        // Map color theme.
        this.mapcolor = false
        // Arbitrary writes.
        this.writes = undefined

        this.self = {};
    }

    static fromJSON(jsonObj) {
        const builder = new PresetBuilder(jsonObj.metadata)
        if ('alias' in jsonObj) {
            jsonObj.alias.forEach(function (alias) {
                if ('zone' in alias) {
                    builder.zoneAlias(alias.zone, alias.alias)
                }
                if ('enemy' in alias) {
                    builder.enemyAlias(alias.enemy, alias.alias)
                }
                if ('relic' in alias) {
                    builder.relicAlias(alias.relic, alias.alias)
                }
                if ('location' in alias) {
                    builder.locationAlias(alias.relic, alias.alias)
                }
                if ('item' in alias) {
                    builder.itemAlias(alias.item, alias.alias)
                }
            })
        }
        if ('inherits' in jsonObj) {
            builder.inherits(jsonObj.inherits)
        }
        if ('itemLocations' in jsonObj) {
            if (typeof (jsonObj.itemLocations) === 'boolean') {
                builder.itemLocations(jsonObj.itemLocations)
            } else if (Array.isArray(jsonObj.itemLocations)) {
                jsonObj.itemLocations.forEach(function (itemLocation) {
                    let zone = getZoneAlias.call(builder, itemLocation.zone)
                    if (zone !== '*') {
                        zone = constants.ZONE[zone]
                    }
                    const args = [zone, itemLocation.item]
                    if ('index' in itemLocation) {
                        args.push(itemLocation.index)
                    }
                    args.push(itemLocation.replacement)
                    builder.itemLocations.apply(builder, args)
                })
            } else {
                throw new Error('unsupported itemLocations type')
            }
        }
        if ('blockItems' in jsonObj) {
            jsonObj.blockItems.forEach(function (itemLocation) {
                let zone = getZoneAlias.call(builder, itemLocation.zone)
                if (zone !== '*') {
                    zone = constants.ZONE[zone]
                }
                const args = [zone, itemLocation.item]
                if ('index' in itemLocation) {
                    args.push(itemLocation.index)
                }
                args.push(itemLocation.replacement)
                builder.blockItem.apply(builder, args)
            })
        }
        if ('enemyDrops' in jsonObj) {
            if (typeof (jsonObj.enemyDrops) === 'boolean') {
                builder.enemyDrops(jsonObj.enemyDrops)
            } else if (Array.isArray(jsonObj.enemyDrops)) {
                jsonObj.enemyDrops.forEach(function (enemyDrop) {
                    const args = [enemyDrop.enemy]
                    if ('level' in enemyDrop) {
                        args.push(enemyDrop.level)
                    }
                    Array.prototype.push.apply(args, enemyDrop.items)
                    builder.enemyDrops.apply(builder, args)
                })
            } else {
                throw new Error('unsupported enemyDrops type')
            }
        }
        if ('blockDrops' in jsonObj) {
            jsonObj.blockDrops.forEach(function (enemyDrop) {
                const args = [enemyDrop.enemy]
                if ('level' in enemyDrop) {
                    args.push(enemyDrop.level)
                }
                args.push(enemyDrop.items)
                builder.blockDrops.apply(builder, args)
            })
        }
        if ('prologueRewards' in jsonObj) {
            if (typeof (jsonObj.prologueRewards) === 'boolean') {
                builder.prologueRewards(jsonObj.prologueRewards)
            } else if (Array.isArray(jsonObj.prologueRewards)) {
                jsonObj.prologueRewards.forEach(function (prologueReward) {
                    builder.prologueRewards(
                        prologueReward.item,
                        prologueReward.replacement,
                    )
                })
            } else {
                throw new Error('unsupported prologueRewards type')
            }
        }
        if ('blockRewards' in jsonObj) {
            jsonObj.blockRewards.forEach(function (blockedReward) {
                builder.blockReward(
                    blockedReward.item,
                    blockedReward.replacement,
                )
            })
        }
        if ('startingEquipment' in jsonObj) {
            if (typeof (jsonObj.startingEquipment) === 'boolean') {
                builder.startingEquipment(jsonObj.startingEquipment)
            } else if (Array.isArray(jsonObj.startingEquipment)) {
                jsonObj.startingEquipment.forEach(function (startingEquipment) {
                    const key = startingEquipment.slot.toUpperCase().replace(' ', '_')
                    builder.startingEquipment(
                        constants.SLOT[key],
                        startingEquipment.item,
                    )
                })
            } else {
                throw new Error('unsupported startingEquipment type')
            }
        }
        if ('blockEquipment' in jsonObj) {
            jsonObj.blockEquipment.forEach(function (blockedEquipment) {
                const key = blockedEquipment.slot.toUpperCase().replace(' ', '_')
                builder.blockEquipment(
                    constants.SLOT[key],
                    blockedEquipment.item,
                )
            })
        }
        if ('relicLocations' in jsonObj) {
            builder.relicLocations(jsonObj.relicLocations)
        }
        if ('preventLeaks' in jsonObj) {
            builder.preventLeaks(jsonObj.preventLeaks)
        }
        if ('thrustSwordAbility' in jsonObj) {
            builder.thrustSwordAbility(jsonObj.thrustSwordAbility)
        }
        if ('relicLocationsExtension' in jsonObj) {
            builder.relicLocationsExtension(jsonObj.relicLocationsExtension)
        }
        if ('lockLocation' in jsonObj) {
            jsonObj.lockLocation.forEach(function (lockLocation) {
                const locationName = getLocationAlias.call(
                    builder,
                    lockLocation.location,
                )
                const location = locationFromName(locationName)
                if ('locks' in lockLocation) {
                    const locks = locksFromArray.call(builder, lockLocation.locks)
                    builder.lockLocation(location, locks)
                }
                if ('block' in lockLocation) {
                    let relic
                    if (Array.isArray(lockLocation.block)) {
                        relic = lockLocation.block.map(function (relic) {
                            return relicFromName(getRelicAlias.call(builder, relic)).ability
                        })
                    } else {
                        relic = getRelicAlias.call(builder, lockLocation.block)
                        relic = relicFromName(relic).ability
                    }
                    builder.blockRelic(location, relic)
                }
                if ('escapeRequires' in lockLocation) {
                    const escapes = locksFromArray.call(
                        builder,
                        lockLocation.escapeRequires,
                    )
                    builder.escapeRequires(location, escapes)
                }
            })
        }
        if ('placeRelic' in jsonObj) {
            jsonObj.placeRelic.forEach(function (placeRelic) {
                let relic = null
                if (Array.isArray(placeRelic.relic)) {
                    relic = placeRelic.relic.map(function (relic) {
                        if (relic) {
                            return relicFromName(getRelicAlias.call(builder, relic)).ability
                        }
                        return null
                    })
                } else if (placeRelic.relic) {
                    relic = getRelicAlias.call(builder, placeRelic.relic)
                    relic = relicFromName(relic).ability
                }
                const location = getLocationAlias.call(builder, placeRelic.location)
                builder.placeRelic(locationFromName(location), relic)
            })
        }
        if ('replaceRelic' in jsonObj) {
            jsonObj.replaceRelic.forEach(function (replaceRelic) {
                const relic = getRelicAlias.call(builder, replaceRelic.relic)
                builder.replaceRelic(
                    relicFromName(relic).ability,
                    replaceRelic.item,
                )
            })
        }
        if ('complexityGoal' in jsonObj) {
            if (jsonObj.complexityGoal) {
                const args = [jsonObj.complexityGoal.min]
                if ('max' in jsonObj.complexityGoal) {
                    args.push(jsonObj.complexityGoal.max)
                }
                args.push(locksFromArray.call(builder, jsonObj.complexityGoal.goals))
                builder.complexityGoal.apply(builder, args)
            } else {
                builder.complexityGoal(false);
            }
        }
        if ('stats' in jsonObj) {
            builder.randomizeStats(jsonObj.stats)
        }
        if ('music' in jsonObj) {
            builder.randomizeMusic(jsonObj.music)
        }
        if ('turkeyMode' in jsonObj) {
            builder.turkeyMode(jsonObj.turkeyMode)
        }
        if ('colorrandoMode' in jsonObj) {
            builder.colorrandoMode(jsonObj.colorrandoMode)
        }
        if ('magicmaxMode' in jsonObj) {
            builder.magicmaxMode(jsonObj.magicmaxMode)
        }
        if ('antiFreezeMode' in jsonObj) {
            builder.antiFreezeMode(jsonObj.antiFreezeMode)
        }
        if ('mypurseMode' in jsonObj) {
            builder.mypurseMode(jsonObj.mypurseMode)
        }
        if ('mapcolorTheme' in jsonObj) {
            builder.mapcolorTheme(jsonObj.mapcolorTheme)
        }
        if ('writes' in jsonObj) {
            let lastAddress = 0
            jsonObj.writes.forEach(function (write) {
                let address = lastAddress
                if ('address' in write) {
                    address = parseInt(write.address)
                }
                if (!('enabled' in write) || write.enabled) {
                    switch (write.type) {
                        case 'char':
                            lastAddress = builder.writeChar(address, write.value)
                            break
                        case 'short':
                            lastAddress = builder.writeShort(address, write.value)
                            break
                        case 'word':
                            lastAddress = builder.writeWord(address, write.value)
                            break
                        case 'long':
                            lastAddress = builder.writeLong(address, write.value)
                            break
                        case 'string':
                            lastAddress = builder.writeString(address, write.value)
                            break
                    }
                } else {
                    lastAddress = address
                }
            })
        }
        return builder
    }

    zoneAlias(what, alias) {
        assert.equal(typeof (what), 'string')
        assert.equal(typeof (alias), 'string')
        this.zoneAliases[alias] = what
    }

    enemyAlias(what, alias) {
        assert.equal(typeof (what), 'string')
        assert.equal(typeof (alias), 'string')
        this.enemyAliases[alias] = what
    }

    relicAlias(what, alias) {
        assert.equal(typeof (what), 'string')
        assert.equal(typeof (alias), 'string')
        this.relicAliases[alias] = what
    }

    locationAlias(what, alias) {
        assert.equal(typeof (what), 'string')
        assert.equal(typeof (alias), 'string')
        this.locationAliases[alias] = what
    }

    itemAlias(what, alias) {
        assert.equal(typeof (what) === 'string' || what instanceof Array)
        assert.equal(typeof (alias) === 'string')
        this.itemAliases[alias] = what
    }

    async inherits(id) {
        let preset;

        // preset = presets.find(p => p.id === id);
        await import(`../build/presets/${id}.mjs`).then((module) => {
            preset = module.default;
        });

        console.log("id", id);
        console.log("preset: ", preset);
        if ('enemyDrops' in preset) {
            if (typeof (preset.enemyDrops) === 'object') {
                const self = this
                self.drops = new Map()
                if ('blocked' in preset.enemyDrops) {
                    self.drops.blocked = new Map()
                    const ids = Object.getOwnPropertyNames(preset.enemyDrops.blocked)
                    ids.forEach(function (id) {
                        let enemy
                        if (id === '*') {
                            enemy = '*'
                        } else if (id === constants.GLOBAL_DROP) {
                            enemy = id
                        } else {
                            enemy = enemyFromIdString(id)
                        }
                        const dropNames = preset.enemyDrops.blocked[id]
                        const drops = dropNames.map(function (name) {
                            return items.filter(function (item) {
                                return item.name === name
                            }).pop()
                        })
                        self.drops.blocked.set(enemy, drops)
                    })
                }
                const ids = Object.getOwnPropertyNames(preset.enemyDrops)
                ids.filter(function (id) {
                    return id !== 'blocked'
                }).forEach(function (id) {
                    let enemy
                    if (id === '*') {
                        enemy = '*'
                    } else if (id === constants.GLOBAL_DROP) {
                        enemy = id
                    } else {
                        enemy = enemyFromIdString(id)
                    }
                    const dropNames = preset.enemyDrops[id]
                    const drops = dropNames.map(function (name) {
                        return items.filter(function (item) {
                            return item.name === name
                        }).pop()
                    })
                    self.drops.set(enemy, drops)
                })
            } else {
                this.drops = preset.enemyDrops
            }
        }
        if ('startingEquipment' in preset) {
            if (typeof (preset.startingEquipment) === 'object') {
                const self = this
                self.equipment = {}
                if (preset.startingEquipment.blocked) {
                    self.equipment.blocked = {}
                    const slots = Object.getOwnPropertyNames(
                        preset.startingEquipment.blocked
                    )
                    slots.forEach(function (slot) {
                        self.equipment.blocked[slot] = items.filter(function (item) {
                            return item.name === preset.startingEquipment.blocked[slot]
                        }).pop()
                    })
                }
                const slots = Object.getOwnPropertyNames(preset.startingEquipment)
                slots.filter(function (slot) {
                    return slot !== 'blocked'
                }).forEach(function (slot) {
                    self.equipment[slot] = preset.startingEquipment[slot].map(
                        function (itemName) {
                            return items.filter(function (item) {
                                return item.name === itemName
                            }).pop()
                        }
                    )
                })
            } else {
                this.equipment = preset.startingEquipment
            }
        }
        if ('prologueRewards' in preset) {
            if (typeof (preset.prologueRewards) === 'object') {
                const self = this
                self.rewards = {}
                if (preset.prologueRewards.blocked) {
                    self.rewards.blocked = {}
                    const rewards = Object.getOwnPropertyNames(
                        preset.prologueRewards.blocked
                    )
                    rewards.forEach(function (reward) {
                        self.rewards.blocked[reward] = items.filter(function (item) {
                            return item.name === preset.prologueRewards.blocked[reward]
                        }).pop()
                    })
                }
                const rewards = Object.getOwnPropertyNames(preset.prologueRewards)
                rewards.filter(function (reward) {
                    return reward !== 'blocked'
                }).forEach(function (reward) {
                    self.rewards[reward] = items.filter(function (item) {
                        return item.name === preset.prologueRewards[reward]
                    }).pop()
                })
            } else {
                this.rewards = preset.prologueRewards
            }
        }
        if ('itemLocations' in preset) {
            if (typeof (preset.itemLocations) === 'object') {
                const self = this
                self.items = {}
                const zoneNames = Object.getOwnPropertyNames(preset.itemLocations)
                zoneNames.forEach(function (zoneName) {
                    self.items[zoneName] = self.items[zoneName] || new Map()
                    const zoneItems = preset.itemLocations[zoneName]
                    const itemNames = Object.getOwnPropertyNames(zoneItems)
                    itemNames.forEach(function (itemName) {
                        let item
                        if (itemName === '*') {
                            item = '*'
                        } else {
                            item = items.filter(function (item) {
                                return item.name === itemName
                            }).pop()
                        }
                        const indexes = Object.getOwnPropertyNames(zoneItems[itemName])
                        indexes.forEach(function (index) {
                            const replace = items.filter(function (item) {
                                return item.name === zoneItems[itemName][index]
                            }).pop()
                            const map = self.items[zoneName].get(item) || {}
                            map[index] = replace
                            self.items[zoneName].set(item, map)
                        })
                    })
                })
            } else {
                this.items = preset.itemLocations
            }
        }
        if ('relicLocations' in preset) {
            if (typeof (preset.relicLocations) === 'object') {
                const self = this
                self.locations = {}
                if ('extension' in preset.relicLocations) {
                    self.extension = preset.relicLocations.extension
                } else {
                    delete self.extension
                }
                if ('leakPrevention' in preset.relicLocations) {
                    self.leakPrevention = preset.relicLocations.leakPrevention
                }
                if ('thrustSwordAbility' in preset.relicLocations) {
                    self.thrustSword = preset.relicLocations.thrustSwordAbility
                }
                if ('placed' in preset.relicLocations) {
                    self.locations.placed = clone(preset.relicLocations.placed)
                }
                if ('replaced' in preset.relicLocations) {
                    self.locations.replaced = clone(preset.relicLocations.replaced)
                }
                if ('blocked' in preset.relicLocations) {
                    self.locations.blocked = clone(preset.relicLocations.blocked)
                }
                const locations = Object.getOwnPropertyNames(preset.relicLocations)
                locations.filter(function (location) {
                    return [
                        'extension',
                        'leakPrevention',
                        'thrustSwordAbility',
                        'placed',
                        'replaced',
                        'blocked',
                    ].indexOf(location) === -1
                }).forEach(function (location) {
                    if ((/^[0-9]+(-[0-9]+)?$/).test(location)) {
                        self.goal = preset.relicLocations[location].map(function (lock) {
                            return new Set(lock)
                        })
                        const parts = location.split('-')
                        self.target = {
                            min: parseInt(parts[0]),
                        }
                        if (parts.length === 2) {
                            self.target.max = parseInt(parts[1])
                        }
                    } else {
                        // Break the lock into access locks and escape requirements.
                        const locks = self.locations[location] || []
                        const escape = self.escapes[location] || []
                        preset.relicLocations[location].forEach(function (lock) {
                            if (lock[0] === '+') {
                                escape.push(new Set(lock.slice(1)))
                            } else {
                                locks.push(new Set(lock))
                            }
                        })
                        self.locations[location] = locks
                        self.escapes[location] = escape
                    }
                })
            } else {
                this.locations = preset.relicLocations
            }
        }
        if ('stats' in preset) {
            this.stats = preset.stats
        }
        if ('music' in preset) {
            this.music = preset.music
        }
        if ('turkeyMode' in preset) {
            this.turkey = preset.turkeyMode
        }
        if ('colorrandoMode' in preset) {
            this.colorrando = preset.colorrandoMode
        }
        if ('magicmaxMode' in preset) {
            this.magicmax = preset.magicmaxMode
        }
        if ('antiFreezeMode' in preset) {
            this.antifreeze = preset.antiFreezeMode
        }
        if ('mypurseMode' in preset) {
            this.mypurse = preset.mypurseMode
        }
        if ('mapcolorTheme' in preset) {
            this.mapcolor = preset.mapcolorTheme
        }
        if ('writes' in preset) {
            this.writes = this.writes || []
            this.writes.push.apply(this.writes, preset.writes)
        }
    }

    enemyDrops(enemyName, level, commonDropName, rareDropName) {
        if (typeof (enemy) === 'boolean') {
            this.drops = enemy
        } else {
            enemyName = getEnemyAlias.call(this, enemyName)
            commonDropName = getItemAlias.call(this, commonDropName)
            rareDropName = getItemAlias.call(this, rareDropName)
            const args = Array.prototype.slice.call(arguments)
            if (typeof (this.drops) !== 'object') {
                this.drops = new Map()
            }
            let enemy;
            if (enemyName === constants.GLOBAL_DROP) {
                enemy = enemyName
            } else if (enemyName === 'Librarian') {
                enemy = 'Librarian'
            } else {
                if (typeof (level) !== 'number') {
                    rareDropName = commonDropName
                    commonDropName = level
                    level = undefined
                } else {
                    args.splice(1, 1)
                }
                if (enemyName === '*') {
                    enemy = '*'
                } else {
                    enemy = enemies.filter(function (enemy) {
                        if (enemy.name === enemyName) {
                            if (typeof (level) !== 'undefined') {
                                return enemy.level === level
                            }
                            return true
                        }
                    }).pop()
                    assert(enemy, 'Unknown enemy: ' + enemyName)
                }
            }
            const dropNames = args.slice(1)
            const drops = dropNames.map(function (dropName) {
                if (dropName) {
                    const item = items.filter(function (item) {
                        return item.name === dropName
                    }).pop()
                    assert(item, 'Unknown item: ' + dropName)
                    return item
                }
            })
            this.drops.set(enemy, drops)
        }
    }

    blockDrops(enemyName, level, drops) {
        enemyName = getEnemyAlias.call(this, enemyName)
        let enemy
        if (enemyName === constants.GLOBAL_DROP) {
            enemy = enemyName
        } else if (enemyName === 'Librarian') {
            enemy = 'Librarian'
        } else {
            if (typeof (level) !== 'number') {
                drops = level
                level = undefined
            }
            if (enemyName === '*') {
                enemy = '*'
            } else {
                enemy = enemies.filter(function (enemy) {
                    if (enemy.name === enemyName) {
                        if (typeof (level) !== 'undefined') {
                            return enemy.level === level
                        }
                        return true
                    }
                }).pop()
                assert(enemy, 'Unknown enemy: ' + enemyName)
            }
        }
        if (!Array.isArray(drops)) {
            drops = [drops]
        }
        const self = this
        drops = drops.map(function (drop) {
            return getItemAlias.call(self, drop)
        })
        drops = drops.map(function (dropName) {
            if (dropName) {
                const item = items.filter(function (item) {
                    return item.name === dropName
                }).pop()
                assert(item, 'Unknown item: ' + dropName)
                return item
            }
        })
        if (typeof (this.drops) !== 'object') {
            this.drops = new Map()
        }
        this.drops.blocked = this.drops.blocked || new Map()
        this.drops.blocked.set(enemy, drops)
    }

    startingEquipment(slot, itemNames) {
        assert.oneOf(slot, [
            true,
            false,
            constants.SLOT.RIGHT_HAND,
            constants.SLOT.LEFT_HAND,
            constants.SLOT.HEAD,
            constants.SLOT.BODY,
            constants.SLOT.CLOAK,
            constants.SLOT.OTHER,
            constants.SLOT.AXEARMOR,
            constants.SLOT.LUCK_MODE,
        ])
        if (typeof (slot) === 'boolean') {
            this.equipment = slot
        } else {
            if (!Array.isArray(itemNames)) {
                itemNames = [itemNames]
            }
            const self = this
            itemNames = itemNames.map(function (name) {
                return getItemAlias.call(self, name)
            })
            if (typeof (this.equipment) !== 'object') {
                this.equipment = {}
            }
            this.equipment[slot] = this.equipment[slot] || []
            itemNames.forEach(function (itemName) {
                let item
                if (itemName) {
                    item = items.filter(function (item) {
                        return item.name === itemName
                    }).pop()
                    assert(item, 'Unknown item: ' + itemName)
                    switch (slot) {
                        case constants.SLOT.RIGHT_HAND:
                            assert.oneOf(item.type, [
                                constants.TYPE.WEAPON1,
                                constants.TYPE.WEAPON2,
                                constants.TYPE.SHIELD,
                                constants.TYPE.USABLE,
                            ])
                            if (self.equipment[constants.SLOT.LEFT_HAND]) {
                                self.equipment[constants.SLOT.LEFT_HAND].forEach(
                                    function (eq) {
                                        assert.notEqual(
                                            eq.type,
                                            constants.TYPE.WEAPON2,
                                            'Cannot equipment ' + eq.name + ' and ' + item.name
                                        )
                                    }
                                )
                            }
                            break
                        case constants.SLOT.LEFT_HAND:
                            assert.oneOf(item.type, [
                                constants.TYPE.WEAPON1,
                                constants.TYPE.SHIELD,
                                constants.TYPE.USABLE,
                            ])
                            if (self.equipment[constants.SLOT.RIGHT_HAND]) {
                                self.equipment[constants.SLOT.RIGHT_HAND].forEach(
                                    function (eq) {
                                        assert.notEqual(
                                            eq.type,
                                            constants.TYPE.WEAPON2,
                                            'Cannot equipment ' + eq.name + ' and ' + item.name
                                        )
                                    }
                                )
                            }
                            break
                        case constants.SLOT.HEAD:
                            assert.equal(item.type, constants.TYPE.HELMET,
                                'Cannot equip ' + item.name + ' on head')
                            break
                        case constants.SLOT.BODY:
                            assert.equal(item.type, constants.TYPE.ARMOR,
                                'Cannot equip ' + item.name + ' on body')
                            break
                        case constants.SLOT.CLOAK:
                            assert.equal(item.type, constants.TYPE.CLOAK,
                                'Cannot equip ' + item.name + ' as cloak')
                            break
                        case constants.SLOT.OTHER:
                            assert.equal(item.type, constants.TYPE.ACCESSORY,
                                'Cannot equip ' + item.name + ' as other')
                            break
                        case constants.SLOT.AXEARMOR:
                            assert.equal(item.type, constants.TYPE.ARMOR,
                                'Cannot equip ' + item.name + ' as armor')
                            break
                        case constants.SLOT.LUCK_MODE:
                            assert.equal(item.type, constants.TYPE.ACCESSORY,
                                'Cannot equip ' + item.name + ' as other')
                            break
                    }
                }
                self.equipment[slot].push(item)
            })
        }
    }

    blockEquipment(slot, itemNames) {
        assert.oneOf(slot, [
            true,
            false,
            constants.SLOT.RIGHT_HAND,
            constants.SLOT.LEFT_HAND,
            constants.SLOT.HEAD,
            constants.SLOT.BODY,
            constants.SLOT.CLOAK,
            constants.SLOT.OTHER,
            constants.SLOT.AXEARMOR,
            constants.SLOT.LUCK_MODE,
        ])
        if (!Array.isArray(itemNames)) {
            itemNames = [itemNames]
        }
        const self = this
        itemNames = itemNames.map(function (name) {
            return getItemAlias.call(self, name)
        })
        if (typeof (this.equipment) !== 'object') {
            this.equipment = {}
        }
        this.equipment.blocked = this.equipment.blocked || {}
        this.equipment.blocked[slot] = this.equipment.blocked[slot] || []
        itemNames.forEach(function (itemName) {
            let item
            if (itemName) {
                item = items.filter(function (item) {
                    return item.name === itemName
                }).pop()
                assert(item, 'Unknown item: ' + itemName)
                switch (slot) {
                    case constants.SLOT.RIGHT_HAND:
                        assert.oneOf(item.type, [
                            constants.TYPE.WEAPON1,
                            constants.TYPE.WEAPON2,
                            constants.TYPE.SHIELD,
                            constants.TYPE.USABLE,
                        ])
                        if (self.equipment[constants.SLOT.LEFT_HAND]) {
                            self.equipment[constants.SLOT.LEFT_HAND].forEach(
                                function (eq) {
                                    assert.notEqual(
                                        eq.type,
                                        constants.TYPE.WEAPON2,
                                        'Cannot equipment ' + eq.name + ' and ' + item.name
                                    )
                                }
                            )
                        }
                        break
                    case constants.SLOT.LEFT_HAND:
                        assert.oneOf(item.type, [
                            constants.TYPE.WEAPON1,
                            constants.TYPE.SHIELD,
                            constants.TYPE.USABLE,
                        ])
                        if (self.equipment[constants.SLOT.RIGHT_HAND]) {
                            self.equipment[constants.SLOT.RIGHT_HAND].forEach(
                                function (eq) {
                                    assert.notEqual(
                                        eq.type,
                                        constants.TYPE.WEAPON2,
                                        'Cannot equipment ' + eq.name + ' and ' + item.name
                                    )
                                }
                            )
                        }
                        break
                    case constants.SLOT.HEAD:
                        assert.equal(item.type, constants.TYPE.HELMET,
                            'Cannot equip ' + item.name + ' on head')
                        break
                    case constants.SLOT.BODY:
                        assert.equal(item.type, constants.TYPE.ARMOR,
                            'Cannot equip ' + item.name + ' on body')
                        break
                    case constants.SLOT.CLOAK:
                        assert.equal(item.type, constants.TYPE.CLOAK,
                            'Cannot equip ' + item.name + ' as cloak')
                        break
                    case constants.SLOT.OTHER:
                        assert.equal(item.type, constants.TYPE.ACCESSORY,
                            'Cannot equip ' + item.name + ' as other')
                        break
                    case constants.SLOT.AXEARMOR:
                        assert.equal(item.type, constants.TYPE.ARMOR,
                            'Cannot equip ' + item.name + ' as armor')
                        break
                    case constants.SLOT.LUCK_MODE:
                        assert.equal(item.type, constants.TYPE.ACCESSORY,
                            'Cannot equip ' + item.name + ' as other')
                        break
                }
            }
            self.equipment.blocked[slot].push(item)
        })
    }

    itemLocations(zoneId, itemName, number, replaceNames) {
        if (typeof (zoneId) === 'boolean') {
            this.items = zoneId
        } else {
            if (typeof (number) === 'string') {
                replaceNames = number
                number = 1
            }
            if (typeof (replaceNames) === 'string') {
                replaceNames = [replaceNames]
            }
            itemName = getItemAlias.call(this, itemName)
            const self = this
            replaceNames = replaceNames.map(function (name) {
                return getItemAlias.call(self, name)
            })
            assert(typeof (number) === 'number', 'Unknown item number: ' + number)
            const index = number - 1
            const zones = ['*'].concat(constants.zoneNames.map(function (zoneName) {
                return constants.ZONE[zoneName]
            }))
            assert.oneOf(zoneId, zones, 'Unknown zone: ' + zoneId)
            let zoneName
            if (zoneId === '*') {
                zoneName = '*'
            } else {
                zoneName = constants.zoneNames[zoneId]
            }
            let item
            if (itemName === '*') {
                item = '*'
            } else {
                item = items.filter(function (item) {
                    return item.name === itemName
                })[0]
                assert(item, 'Unknown item: ' + itemName)
                const tiles = (item.tiles || []).filter(function (tile) {
                    return 'zones' in tile && tile.zones.indexOf(zoneId) !== -1
                })
                assert(tiles[index], 'Unknown item tile: ' + itemName + ' ' + number)
            }
            if (typeof (this.items) !== 'object') {
                this.items = {}
            }
            this.items[zoneName] = this.items[zoneName] || new Map()
            const map = this.items[zoneName].get(item) || {}
            map[number - 1] = map[number - 1] || []
            const replaceFunc = function (replaceName) {
                const replace = items.filter(function (item) {
                    return item.name === replaceName
                })[0]
                assert(replace, 'Unknown item: ' + replaceName)
                map[number - 1].push(replace)
            };
            replaceNames.forEach(name => {
                if (name instanceof Array) {
                    name.forEach(replaceFunc)
                } else {
                    replaceFunc(name)
                }
            })
            this.items[zoneName].set(item, map)
        }
    }

    // Block an item from a tile.
    blockItem(zoneId, itemName, number, replaceNames) {
        if (typeof (number) !== 'number') {
            replaceNames = number
            number = 1
        }
        if (!Array.isArray(replaceNames)) {
            replaceNames = [replaceNames]
        }
        itemName = getItemAlias.call(this, itemName)
        const self = this
        replaceNames = replaceNames.map(function (name) {
            return getItemAlias.call(self, name)
        })
        assert(typeof (number) === 'number', 'Unknown item number: ' + number)
        const index = number - 1
        const zones = ['*'].concat(constants.zoneNames.map(function (zoneName) {
            return constants.ZONE[zoneName]
        }))
        assert.oneOf(zoneId, zones, 'Unknown zone: ' + zoneId)
        let zoneName
        if (zoneId === '*') {
            zoneName = '*'
        } else {
            zoneName = constants.zoneNames[zoneId]
        }
        let item
        if (itemName === '*') {
            item = '*'
        } else {
            item = items.filter(function (item) {
                return item.name === itemName
            })[0]
            assert(item, 'Unknown item: ' + itemName)
            const tiles = (item.tiles || []).filter(function (tile) {
                return 'zones' in tile && tile.zones.indexOf(zoneId) !== -1
            })
            assert(tiles[index], 'Unknown item tile: ' + itemName + ' ' + number)
        }
        if (typeof (this.items) !== 'object') {
            this.items = {}
        }
        this.items.blocked = this.items.blocked || {}
        this.items.blocked[zoneName] = this.items.blocked[zoneName] || new Map()
        const map = this.items.blocked[zoneName].get(item) || {}
        map[number - 1] = map[number - 1] || []
        replaceNames.forEach(function (replaceName) {
            const replace = items.filter(function (item) {
                return item.name === replaceName
            })[0]
            assert(replace, 'Unknown item: ' + replaceName)
            map[number - 1].push(replace)
        })
        this.items.blocked[zoneName].set(item, map)
    }

    prologueRewards(itemName, replaceNames) {
        if (typeof (itemName) === 'boolean') {
            this.rewards = itemName
        } else {
            itemName = getItemAlias.call(this, itemName)
            if (!Array.isArray(replaceNames)) {
                replaceNames = [replaceNames]
            }
            const self = this
            replaceNames = replaceNames.map(function (name) {
                return getItemAlias.call(self, name)
            })
            assert.oneOf(itemName, Object.getOwnPropertyNames(PresetBuilder.rewardsMap),
                'Unknown reward item: ' + itemName)
            if (typeof (this.rewards) !== 'object') {
                this.rewards = {}
            }
            this.rewards[PresetBuilder.rewardsMap[itemName]] ||= [];
            replaceNames.forEach(function (replaceName) {
                const replace = items.filter(function (item) {
                    return item.name === replaceName
                })[0]
                self.rewards[PresetBuilder.rewardsMap[itemName]].push(replace)
            })
        }
    }

    // Block an item from being a reward.
    blockReward(itemName, blocked) {
        assert.equal(typeof (itemName), 'string')
        if (Array.isArray(blocked)) {
            blocked.forEach(function (itemName) {
                if (itemName) {
                    assert.equal(typeof (itemName), 'string')
                }
            })
        } else if (blocked) {
            assert.equal(typeof (blocked), 'string')
        }
        if (!Array.isArray(blocked)) {
            blocked = [blocked]
        }
        const self = this
        blocked = blocked.map(function (name) {
            return getItemAlias.call(self, name)
        })
        assert.oneOf(itemName, Object.getOwnPropertyNames(PresetBuilder.rewardsMap),
            'Unknown reward item: ' + itemName)
        if (typeof (this.rewards) !== 'object') {
            this.rewards = {}
        }
        this.rewards.blocked = this.rewards.blocked || {}
        this.rewards.blocked[PresetBuilder.rewardsMap[itemName]] =
            this.rewards.blocked[PresetBuilder.rewardsMap[itemName]] || []
        blocked.forEach(function (replaceName) {
            const replace = items.filter(function (item) {
                return item.name === replaceName
            })[0]
            self.rewards.blocked[PresetBuilder.rewardsMap[itemName]].push(replace)
        })
    }

    // Lock relic location behind abilities.
    lockLocation(where, what) {
        if (typeof (this.locations) !== 'object') {
            this.locations = {}
        }
        this.locations[where] = what.map(function (lock) {
            return new Set(lock)
        })
    }

    // Block a relic from appearing at a location.
    blockRelic(where, what) {
        assert.equal(typeof (where), 'string')
        if (Array.isArray(what)) {
            what.forEach(function (relic) {
                if (relic) {
                    assert.equal(typeof (relic), 'string')
                }
            })
        } else if (what) {
            assert.equal(typeof (what), 'string')
        }
        if (!Array.isArray(what)) {
            what = [what]
        }
        if (typeof (this.locations) !== 'object') {
            this.locations = {}
        }
        this.locations.blocked = this.locations.blocked || {}
        this.locations.blocked[where] = what
    }

    // Ensure that a location grants abilities, or that access to that location
    // is only granted by obtaining abilities.
    escapeRequires(where, what) {
        if (typeof (this.locations) !== 'object') {
            this.locations = {}
        }
        this.escapes[where] = what.map(function (lock) {
            return new Set(lock)
        })
    }

    // Place a relic at a location.
    placeRelic(where, what) {
        assert.equal(typeof (where), 'string')
        if (Array.isArray(what)) {
            what.forEach(function (relic) {
                if (relic) {
                    assert.equal(typeof (relic), 'string')
                }
            })
        } else if (what) {
            assert.equal(typeof (what), 'string')
        }
        if (!Array.isArray(what)) {
            what = [what]
        }
        if (typeof (this.locations) !== 'object') {
            this.locations = {}
        }
        this.locations.placed = this.locations.placed || {}
        this.locations.placed[where] = what
    }

    // Replace a relic with an item.
    replaceRelic(relic, item) {
        assert.equal(typeof (relic), 'string')
        assert.equal(typeof (item), 'string')
        locations.replaced ||= {};
        locations.replaced[relic] = getItemAlias.call(this, item)
    }

    // Enable/disable relic location randomization.
    relicLocations(enabled) {
        assert.equal(typeof (enabled), 'boolean')
        this.locations = enabled
    }

    // Enable/disable progression item leak prevention.
    preventLeaks(enabled) {
        assert.equal(typeof (enabled), 'boolean')
        this.leakPrevention = enabled
    }

    // Enable/disable thrust sword ability.
    thrustSwordAbility(enabled) {
        assert.equal(typeof (enabled), 'boolean')
        this.thrustSword = enabled
    }

    // Set complexity target.
    complexityGoal(complexityMin, complexityMax, goal) {
        if (arguments.length === 1 && typeof (complexityMin) !== 'number') {
            delete this.goal
            delete this.target
        } else {
            assert(
                typeof (complexityMin) === 'number',
                'expected complexityMin to be a number'
            )
            if (Array.isArray(complexityMax)) {
                goal = complexityMax
                complexityMax = undefined
            } else {
                assert(
                    typeof (complexityMax) === 'number',
                    'expected complexityMax to be a number'
                )
            }
            assert(goal.every(function (lock) {
                return typeof (lock) === 'string'
            }), 'expected goal to be an array of strings')
            assert(Array.isArray(goal), 'expected goal to be an array of strings')
            this.goal = goal.map(function (lock) {
                return new Set(lock)
            })
            this.target = {
                min: complexityMin,
            }
            if (typeof (complexityMax) !== 'undefined') {
                this.target.max = complexityMax
            }
        }
    }

    // Enable guarded relic locations.
    relicLocationsExtension(extension) {
        assert.oneOf(typeof (extension), ['boolean', 'string'])
        this.extension = extension
    }

    // Enable stat randomization.
    randomizeStats(enabled) {
        this.stats = enabled
    }

    // Enable music randomization.
    randomizeMusic(enabled) {
        this.music = enabled
    }

    // Enable turkey mode.
    turkeyMode(enabled) {
        this.turkey = enabled
    }

    // Enable Color Palette Randomization
    colorrandoMode(enabled) {
        this.colorrando = enabled
    }

    // Enable Magic Max replacing Heart Max
    magicmaxMode(enabled) {
        this.magicmax = enabled
    }

    // remove screen freezes from level up, relic, vessel. - eldri7ch & MottZilla
    antiFreezeMode(enabled) {
        this.antifreeze = enabled
    }

    // Prevent Death from stealing equipment - eldri7ch
    mypurseMode(enabled) {
        this.mypurse = enabled
    }

    // Map Color added for compatibility - eldri7ch
    mapcolorTheme(mapcol) {
        mapcol = 'u'
        this.mapcolor = mapcol
    }

    // Write a character.
    writeChar(address, value) {
        if (value !== 'random' && value !== 'random1' && value !== 'random3' && value !== 'random10' && value !== 'random99') {
            value = parseInt(value)
        }
        this.writes = this.writes || []
        this.writes.push({
            type: 'char',
            address: address,
            value: value,
        })
        address = address + 1					// Step adddress. 
        if (Math.floor(address % 2352) > 2071) {			// Then check if new address is beyond User Data section.
            address = (Math.floor(address / 2352) * 2352) + 2376	// If beyond user data section then return the beginning of the next sector's user data section. - MottZilla
        }
        return address
    }

    // Write a short.
    writeShort(address, value) {
        if (value !== 'random') {
            value = parseInt(value)
        }
        this.writes = this.writes || []
        this.writes.push({
            type: 'short',
            address: address,
            value: value,
        })
        address = address + 2					// Step adddress. 
        if (Math.floor(address % 2352) > 2071) {			// Then check if new address is beyond User Data section.
            address = (Math.floor(address / 2352) * 2352) + 2376	// If beyond user data section then return the beginning of the next sector's user data section. - MottZilla
        }
        return address
    }

    // Write a word.
    writeWord(address, value) {
        if (value !== 'random' && value !== 'randomRelic') {
            value = parseInt(value)
        }
        this.writes = this.writes || []
        this.writes.push({
            type: 'word',
            address: address,
            value: value,
        })
        address = address + 4					// Step adddress. 
        if (Math.floor(address % 2352) > 2071) {			// Then check if new address is beyond User Data section.
            address = (Math.floor(address / 2352) * 2352) + 2376	// If beyond user data section then return the beginning of the next sector's user data section. - MottZilla
        }
        return address
    }

    // Write a long.
    writeLong(address, value) {
        this.writes = this.writes || []
        this.writes.push({
            type: 'long',
            address: address,
            value: value,
        })
        address = address + 8					// Step adddress. 
        if (Math.floor(address % 2352) > 2071) {			// Then check if new address is beyond User Data section.
            address = (Math.floor(address / 2352) * 2352) + 2376	// If beyond user data section then return the beginning of the next sector's user data section. - MottZilla
        }
        return address
    }

    // Write a string.
    writeString(address, value) {
        if (typeof (value) === 'string') {
            const hexBytes = value.split(/([a-fA-F0-9]{2})/g)
            value = hexBytes.reduce(function (bytes, byteValue) {
                if (byteValue.length) {
                    bytes.push(parseInt(byteValue, 16))
                }
                return bytes
            }, [])
        }
        this.writes = this.writes || []
        this.writes.push({
            type: 'string',
            address: address,
            value: value,
        })
        return address + value.length
    }

    // Create a preset from the current configuration.
    build() {
        const self = this
        let drops = self.drops
        if (typeof (drops) === 'object') {
            drops = {}
            if (self.drops.blocked) {
                drops.blocked = {}
                Array.from(self.drops.blocked.keys()).forEach(function (enemy) {
                    let enemyName
                    if (enemy === '*') {
                        enemyName = '*'
                    } else if (enemy === constants.GLOBAL_DROP) {
                        enemyName = enemy
                    } else if (enemy === 'Librarian') {
                        enemyname = enemy
                    } else {
                        enemyName = enemy.name
                        const amb = enemies.filter(function (enemy) {
                            return enemy.name === enemyName
                        })
                        enemyName = enemyName.replace(/\s+/g, '')
                        if (amb.length > 1 && enemy !== amb[0]) {
                            enemyName += '-' + enemy.level
                        }
                    }
                    drops.blocked[enemyName] =
                        self.drops.blocked.get(enemy).slice().map(function (item) {
                            return item ? item.name : undefined
                        })
                })
            }
            Array.from(self.drops.keys()).forEach(function (enemy) {
                let enemyName
                if (enemy === '*') {
                    enemyName = '*'
                } else if (enemy === constants.GLOBAL_DROP) {
                    enemyName = enemy
                } else {
                    enemyName = enemy.name
                    const amb = enemies.filter(function (enemy) {
                        return enemy.name === enemyName
                    })
                    enemyName = enemyName.replace(/\s+/g, '')
                    if (amb.length > 1 && enemy !== amb[0]) {
                        enemyName += '-' + enemy.level
                    }
                }
                drops[enemyName] = self.drops.get(enemy).slice().map(function (item) {
                    return item ? item.name : undefined
                })
            })
        }
        let equipment = self.equipment
        if (typeof (equipment) === 'object') {
            equipment = {}
            if (self.equipment.blocked) {
                equipment.blocked = {}
                Object.getOwnPropertyNames(self.equipment.blocked).forEach(
                    function (slot) {
                        equipment.blocked[slot] = self.equipment.blocked[slot].map(
                            function (item) {
                                return item.name
                            }
                        )
                    }
                )
            }
            Object.getOwnPropertyNames(self.equipment).filter(function (slot) {
                return self.equipment[slot] && slot !== 'blocked'
            }).forEach(function (slot) {
                equipment[slot] = self.equipment[slot].map(function (item) {
                    if (item) {
                        return item.name
                    }
                })
            })
        }
        let rewards = self.rewards
        if (typeof (rewards) === 'object') {
            rewards = {}
            if (self.rewards.blocked) {
                rewards.blocked = {}
                Object.getOwnPropertyNames(self.rewards.blocked).forEach(
                    function (reward) {
                        rewards.blocked[reward] = self.rewards.blocked[reward].map(
                            function (item) {
                                return item.name
                            }
                        )
                    }
                )
            }
            Object.getOwnPropertyNames(self.rewards).filter(function (reward) {
                return reward !== 'blocked'
            }).forEach(function (reward) {
                rewards[reward] = self.rewards[reward].map(function (item) {
                    if (item) {
                        return item.name
                    }
                })
            })
        }
        let items = self.items
        if (typeof (items) === 'object') {
            items = {}
            if (self.items.blocked) {
                items.blocked = {}
                Object.getOwnPropertyNames(self.items.blocked).forEach(function (zone) {
                    items.blocked[zone] = {}
                    Array.from(self.items.blocked[zone].keys()).forEach(function (item) {
                        const indexes = self.items.blocked[zone].get(item)
                        let itemName
                        if (item === '*') {
                            itemName = '*'
                        } else {
                            itemName = item.name
                        }
                        items.blocked[zone][itemName] = {}
                        Object.getOwnPropertyNames(indexes).forEach(function (index) {
                            const replace = self.items.blocked[zone].get(item)[index]
                            items.blocked[zone][itemName][index] = replace.map(
                                function (item) {
                                    return item.name
                                }
                            )
                        })
                    })
                })
            }
            Object.getOwnPropertyNames(self.items).filter(function (zone) {
                return zone !== 'blocked'
            }).forEach(function (zone) {
                items[zone] = {}
                Array.from(self.items[zone].keys()).forEach(function (item) {
                    const indexes = self.items[zone].get(item)
                    let itemName
                    if (item === '*') {
                        itemName = '*'
                    } else {
                        itemName = item.name
                    }
                    items[zone][itemName] = {}
                    Object.getOwnPropertyNames(indexes).forEach(function (index) {
                        const replace = self.items[zone].get(item)[index]
                        items[zone][itemName][index] = replace.map(function (item) {
                            return item.name
                        })
                    })
                })
            })
        }
        let relicLocations = self.locations
        if (typeof (relics) === 'object') {
            relicLocations = {}
            relics.concat(extension).map(function (location) {
                if (typeof (location.ability) === 'string') {
                    return location.ability
                }
                return location.name
            }).forEach(function (location) {
                if (self.locations[location]) {
                    const locks = self.locations[location].map(function (lock) {
                        return Array.from(lock).join('')
                    })
                    relicLocations[location] = relicLocations[location] || []
                    Array.prototype.push.apply(relicLocations[location], locks)
                }
                if (self.escapes[location]) {
                    const locks = self.escapes[location].map(function (lock) {
                        return '+' + Array.from(lock).join('')
                    })
                    relicLocations[location] = relicLocations[location] || []
                    Array.prototype.push.apply(relicLocations[location], locks)
                }
            })
            if (self.locations.placed) {
                relicLocations.placed = self.locations.placed
            }
            if (self.locations.replaced) {
                relicLocations.replaced = self.locations.replaced
            }
            if (self.locations.blocked) {
                relicLocations.blocked = self.locations.blocked
            }
            if (self.goal) {
                let target = self.target.min.toString()
                if ('max' in self.target) {
                    target += '-' + self.target.max.toString()
                }
                relicLocations[target] = self.goal.map(function (lock) {
                    return Array.from(lock).join('')
                })
            }
            if (self.extension) {
                relicLocations.extension = self.extension
            }
            if (!self.leakPrevention) {
                relicLocations.leakPrevention = false
            }
            if (self.thrustSword) {
                relicLocations.thrustSwordAbility = true
            }
        }
        const stats = self.stats
        const music = self.music
        const turkey = self.turkey
        const colorrando = self.colorrando
        const magicmax = self.magicmax
        const antifreeze = self.antifreeze
        const mypurse = self.mypurse
        const mapcolor = self.mapcolor
        const writes = self.writes
        return new Preset(
            self.metadata.id,
            self.metadata.name,
            self.metadata.description,
            self.metadata.author,
            self.metadata.weight || 0,
            self.metadata.hidden,
            self.metadata.override,
            drops,
            equipment,
            items,
            rewards,
            relicLocations,
            stats,
            music,
            turkey,
            colorrando,
            magicmax,
            antifreeze,
            mypurse,
            mapcolor,
            writes,
        )
    }

}
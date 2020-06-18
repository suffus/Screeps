/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Repairer');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    type: 'repairer',
    min: function() {return 0;},
    max: function() {
        if( Memory.urgentRepairs !== undefined && Object.values( Memory.urgentRepairs ).length > 0 ) {
            return Math.ceil(3 + Object.values(Memory.urgentRepairs).length / 4);

        } else {
            return 3;
        }
    },
    min_energy: function() {return 800},
    max_energy: function() {return 1000;},
    work_sequence: function() {return ['builder'];},

    findPoorStructures: function( ) {
        o_out = []
        ctr = 0
        for( let s in Game.structures ) {
            struct = Game.structures[s];
            if( Memory.deprecatedStructures[struct.id] != undefined ) {
              continue;
            }
            if( struct == null || struct == undefined ) {
                ctr++
                continue;
            }
            if( (struct.hits / struct.hitsMax) < 0.9 ) {
                console.log("pushing poor structure " + JSON.stringify(struct))
                o_out.push( struct )
            }
        }
        desc = ""
        n = 10
        console.log( "There are " + o_out.length + " non null structures.  cnt = " + ctr)
        for( let obj of o_out ) {
            desc += obj.toString() + " hits: " + obj.hits + ", hitsMax:" + obj.hitsMax + "\n"
            n--
            if( n <= 0 ) {
                break;
            }
        }
        console.log( "Worse structures are: " + desc )
        //return o_out;
    },

    run: function(creep, shouldNotBuild) {
        var roleBrickie = require('Brickie');
        var roleBuilder = require('Builder');
        var roleUpgrader = require('TopUp');
        var common = require('Common');
        // if creep is trying to repair something but has no energy left

        if( common.gotoFlag( creep ) < 0 ) {
            return;
        }

        // if creep is supposed to repair something
        if (common.checkWorking( creep ) == true) {
            // find closest structure with less than max hits
            // Exclude walls because they have way too many max hits and would keep
            // our repairers busy forever. We have to find a solution for that later.

            //var worseStructures = _.map(Game.structures, (x,y) => x).sort( (y,x) => y.hits / y.hitsMax - x.hits / x.hitsMax );
            //for( s of worseStructures ) {
            //    console.log( s + ": hits:" + s.hits + " max: " + s.hitsMax)
            //}
            urgents = [];
            if( Memory.urgentRepairs != undefined ) {
                urgents = _.filter( Memory.urgentRepairs, (x,y) => x != undefined ? x.repairer == creep.name : false );
            }
            let structure
            if( creep.memory.currentTarget ) {
                structure = Game.getObjectById( creep.memory.currentTarget )
            }
            if( urgents[0] != undefined ) {
                structure = Game.getObjectById(urgents[0].id)
            } else if( !structure ) {
                structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                // the second argument for findClosestByPath is an object which takes
                // a property called filter which can be a function
                // we use the arrow operator to define it
                    filter: (s) => s.hits < s.hitsMax && s.structureType != STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART && Memory.deprecatedStructures[s.id] == undefined
                });
            }

            // if we find one
            if (structure) {
                creep.memory.currentTarget = structure.id
                // try to repair it, if it is out of range
                let err
                if ((err = creep.repair(structure)) == ERR_NOT_IN_RANGE) {
                    // move towards it
                    creep.memory.firstOK = false
                    creep.moveTo(structure);
                    console.log(creep.name + " looking to repair structure " + structure + " at " + structure.pos)
                } else {
                    if( err == OK && !creep.memory.firstOK ) {
                        creep.memory.firstOK = true
                        let pos = common.findClearSquare( structure, 1 )
                        creep.memory.repairFrom = pos || creep.pos
                    }
                    if( creep.pos.getRangeTo( creep.memory.repairFrom ) > 0 ) {
                        creep.moveTo( pos )
                    }
                    if( structure.hitsMax - structure.hits === 0 ) {
                        creep.memory.currentTarget = undefined
                    }
                }
            } else {
                console.log( creep.name + " cannot find anything to repair! " + creep.pos.roomName)
                if( !shouldNotBuild ) {
                    roleBuilder.run( creep, true );
                }
            }
        }
            // if creep is supposed to get energy
        else {
            common.fillHerUp( creep );
        }
    }
};

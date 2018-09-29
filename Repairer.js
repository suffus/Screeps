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
    min: function() {return 2;},
    max: function() {return 3;},
    max_energy: function() {return 1200;},
    work_sequence: function() {return ['brickie'];},
    
    findPoorStructures: function( ) {
        o_out = []
        ctr = 0
        for( let s in Game.structures ) {
            struct = Game.structures[s]
            if( struct == null || struct == undefined ) {
                ctr++
                continue;
            }
            if( (struct.hits / struct.hitsMax) < 0.9 ) {
                console.log("pushing " + struct)
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

    run: function(creep) {
        var roleBrickie = require('Brickie');
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
            
            if( urgents[0] != undefined ) {
                structure = Game.getObjectById(urgents[0].id)
            } else {
                structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                // the second argument for findClosestByPath is an object which takes
                // a property called filter which can be a function
                // we use the arrow operator to define it
                    filter: (s) => s.hits < s.hitsMax && s.structureType != STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART
                });
            }

            // if we find one
            if (structure != undefined) {
                // try to repair it, if it is out of range
                if (creep.repair(structure) == ERR_NOT_IN_RANGE) {
                    // move towards it
                    creep.moveTo(structure);
                    console.log(creep.name + " looking to repair structure " + structure + " at " + structure.pos)
                }
            } else {
                console.log( creep.name + " cannot find anything to repair! " + creep.pos.roomName)
                if( creep.pos.roomName != common.home ) {
                    creep.memory.targetFlag = 'Flag1';
                    return;
                }
            }
        }
            // if creep is supposed to get energy
        else {
           common.fillHerUp( creep );
        }
    }
};
/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('MineralHarvester');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    type: 'mineralHarvester',
    min: function() {
        return 0;
    },
    max: function() {
        return 1;
    },

    run: function( creep ) {
        common = require('Common');
        if( common.gotoFlag( creep ) == ERR_BUSY ) {
            return;
        }

        if( creep.memory.working == true ) {
            dropped_resource = creep.room.find( FIND_DROPPED_RESOURCES, {
                filter: (x) => x.resourceType != RESOURCE_ENERGY
            } );
            if( dropped_resource.length > 0 && creep.pos.getRangeTo( dropped_resource[0] ) < 5 ) {
                if( creep.pickup( dropped_resource[0] ) == ERR_NOT_IN_RANGE ) {
                    creep.moveTo( dropped_resource[0]);
                    return;
                }
            }

            mines = creep.room.find( FIND_MINERALS );
            if( mines[0] == undefined ) {
                console.log( "Miner " + creep.name + " has no work to do.");
                creep.memory.status = "onthebrew";
                return;
            } else {
                creep.memory.status = "employed";
            }
            if( (err = creep.harvest( mines[0] )) == ERR_NOT_IN_RANGE) {
                creep.moveTo( mines[0] );
                return;
            }
            if( err != 0 ) {
                console.log( creep.name + " receioeved " + err + " trying to harvest minerals from " + mines[0])
            }
            if( _.sum( creep.carry ) == creep.carryCapacity ) {
                creep.memory.working = false;
            }
        } else {
            var structure = undefined;
            if( creep.memory.transfer_structure != undefined ) {
                structure = Game.getObjectById( creep.memory.transfer_structure );
            }
            if( structure == undefined ) {
                terminals = creep.room.find( FIND_STRUCTURES, {filter: (x) => x.structureType == STRUCTURE_TERMINAL} );
                if( terminals[0] == undefined ) {
                    console.log( "No Terminal Found for " + creep.name );
                    stores = creep.room.find( FIND_STRUCTURES, {filter: (x) => x.structureType == STRUCTURE_STORAGE} );
                    if( stores[0] != undefined ) {
                        structure = stores[0];
                    }
                } else {
                    structure = terminals[0];
                }
                if( structure != undefined ) {
                    creep.memory.transfer_structure = structure.id;
                } else {
                    creep.memory.transfer_structure = undefined;
                }
            }
            d = creep.pos.getRangeTo( structure );
            if( d > 1 ) {
                creep.moveTo( structure);
                return;
            }
            for( let eT in creep.carry ) {
                console.log( creep.name + " looking to transfer minerals")
                let trans_p = false;
                if( creep.carry[eT]>0 ) {
                    trans_p = true;
                    if( (err = creep.transfer( structure, eT )) == ERR_NOT_IN_RANGE ) {
                        creep.moveTo( structure );
                        return;
                    }
                    if( err != 0 ) {
                        console.log( "Transfer request of " + creep.name + " received " + err + " ttrying to trasfer minerals");
                    }
                }
                if( trans_p == false ) {
                    creep.memory.working = true;
                    creep.memory.transfer_structure = undefined;
                }
            }
        }

    }

};

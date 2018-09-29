/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Harvester');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    type: 'harvester',


    min: function( ) {return 2;},
    max: function( ) {return 2;},
    min_energy: function() {return 800;},
    max_energy: function() {return 800;},
    work_sequence: function() {return ['slacker'];},

    create_jobs: function( roomName ) {
        room = Game.rooms[roomName];
        if( room == undefined ) {
            return undefined;
        }
        // are there any spawns here?
        
        spawns = _.filter( Game.spawns, (x) => x.pos.roomName == roomName && x.my == true );
        if( spawns.length > 0 ) {
            job = {
                role: this.type,
                job: this.type + ":" + roomName,
                min: 2,
                max: 2,
                spawns: _.map( spawns, (x) => x.id ),
                scaleable: false,
                body: [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE],
                priority: 99
            }
            rV = {};
            rV[ job.job ] = job;
            return rV;
        }
        return {};
    },

    force_convert: function( creep ) {
        for( k in creep.memory ) {
            delete creep.memory.k;
        }
        creep.memory.role = 'harvester';
        creep.working = false;
    },

    createBody: function( energy, spawn, options ) {
        common = require('Common');
        if( options == undefined && energy > 800 ) {
            energy = 800;
        }
        var bodyTemplate = [{part:CARRY, quantity:6},{part:MOVE, quantity:3}];
        if( options != undefined ) {
            if( options.long_range == true ) {
                bodyTemplate = [{part:CARRY, quantity:6},{part:MOVE, quantity:6}];
            }
            if( options.maxEnergy != undefined ) {
                if( energy > options.maxEnergy ) {
                    energy = options.maxEnegry;
                }
            }
        }
        return common.createBody( bodyTemplate, energy );
    },

    createCreep1: function( spawn, energy, options ) {
        body = this.createBody( energy, options );
        var creep_mem = {role:'harvester',working:false,model:'local'};
        if( options != undefined ) {
            if( options.route != undefined ) {

            }
        }

    },

    run: function( creep ) {
        common=require('Common');

        if( common.gotoFlag( creep ) == ERR_BUSY ) {
            return;
        }

        if( common.checkWorking( creep ) == true ) {
             var structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: (s) => (s.structureType == STRUCTURE_SPAWN
                             || s.structureType == STRUCTURE_EXTENSION
                             || s.structureType == STRUCTURE_TOWER)
                             && s.energy < s.energyCapacity
            });
            if( structure == undefined ) {
                console.log('Harvester '+ creep.name + ' storing energy');
                structure = creep.pos.findClosestByPath( FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_STORAGE
                });
            }
            if( structure != undefined ) {
                if( (err = creep.transfer( structure, RESOURCE_ENERGY )) == ERR_NOT_IN_RANGE ) {
                    creep.moveTo( structure );
                } else if( err != 0 ) {
                    console.log('Harvester received '+ err + ' while trying to transfer stuff to ' + scructure)
                }

            } else {
                spawns = creep.room.find( FIND_STRUCTURES, (x) => x.structureType == STRUCTURE_SPAWN );
                spawn = spawns[0];
                creep.moveTo( spawn );
            }
        } else {
            if( creep.carry.energy == creep.carryCapacity) {
                creep.memory.working = true;
                return;
            }
            common.fillHerUp( creep, undefined, undefined, (x) => common.isInRegion( x.pos, 'spawnRegion' ) );
        }
    }
};

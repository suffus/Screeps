/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Harvester');
 * mod.thing == 'a thing'; // true
 */

const common = require('Common')

module.exports = {
    type: 'harvester',
    min: function( ) {return 2;},
    max: function( ) {return 3;},
    min_energy: function() {return 600;},
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
                min: 1,
                max: 3,
                spawns: _.map( spawns, (x) => x.id ),
                options: {room:roomName},
                scaleable: false,
                bodySmall: [WORK,WORK,CARRY,MOVE],
                body: [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE],
                bodyLarge: [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE],
                priority: 99
            };
            rV = {};
            rV[ job.job ] = job;
            return rV;
        }
        return {}; /// no jobs if no spawns
    },

    force_convert: function( creep ) {
        for( k in creep.memory ) {
            delete creep.memory.k;
        }
        creep.memory.role = 'harvester';
        creep.working = false;
    },

    createBody: function( energy, spawn, options ) {
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

    getTargetStructure: function( creep ) {
        let fillStructures = ((common.roomInfo[creep.pos.roomName] || {}).fillStructures || {})
      var structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
         filter: (s) => (s.structureType == STRUCTURE_SPAWN
                      || s.structureType == STRUCTURE_EXTENSION
                      || s.structureType == STRUCTURE_TOWER
                      || fillStructures[s.id] !== undefined)
                      && s.energy < s.energyCapacity
                      && s.pos.roomName == creep.memory.room
     });
      return structure;
    },

    run: function( creep ) {

        if( common.gotoFlag( creep ) == ERR_BUSY ) {
            return;
        }

        if( common.checkWorking( creep ) == true ) {
             //console.log('Harvester '+ creep.name + ' storing energy');
            var structure = this.getTargetStructure( creep );
            if( structure === undefined || structure === null) {
                console.log('Harvester '+ creep.name + ' trying to store energy in a storage');
                structure = creep.pos.findClosestByPath( FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_STORAGE && s.pos.roomName == creep.memory.room
                });
                creep.memory.status = 'storing';
            } else {
              creep.memory.status = 'stoking';
            }
            if( structure != undefined ) {
                if( (err = creep.transfer( structure, RESOURCE_ENERGY )) == ERR_NOT_IN_RANGE ) {
                    creep.moveTo( structure );
                } else if( err != 0 ) {
                    console.log('Harvester received '+ err + ' while trying to transfer stuff to ' + structure)
                }
            } else {
                let rN = creep.memory.room || creep.pos.roomName;
                spawns = Game.rooms[rN].find( FIND_MY_STRUCTURES, (x) => x.structureType == STRUCTURE_SPAWN );
                spawn = spawns[0];
                if( creep.pos.getRangeTo( spawn ) > 2 ) {
                    creep.moveTo( spawn );
                }
                return;
            }
        } else {
            // console.log('Harvester '+ creep.name + ' acquiring');
            if( creep.pos.roomName != creep.memory.room ) {
                if( creep.memory.room != undefined ) {
                    creep.moveTo( common.roomInfo[creep.memory.room].flag );
                    return;
                }
            }
            if( creep.carry.energy == creep.carryCapacity) {
                creep.memory.working = true;
                return;
            }
            err = common.fillHerUp( creep )
            if( err == ERR_NOT_ENOUGH_RESOURCES ) {
              console.log( "NO SOURCES FOR HARVESTER " + creep.name );
              ///// allocate a source
            } else if( err !== ERR_NOT_IN_RANGE ) {
              console.log( "FILLHERUP RETURNED " + err + " FOR HARVESTER " + creep.name);
            }
        }
    }
};

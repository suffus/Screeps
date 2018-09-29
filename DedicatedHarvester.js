/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('DedicatedHarvester');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    type: 'dedicated_harvester',
    min: function() {return 2;},
    max: function() {return 2;},
    min_energy: function() {return 1200;},
    max_energy: function() {return 1200;},
    work_sequence: function() {return ['slacker'];},
    getTarget: function( room ) {
        var sources = Game.rooms[room].find( FIND_SOURCES );
        var dedicated_sources = _.map(_.filter( Game.creeps, (x) => x.memory.role == 'dedicated_harvester' && x.ticksToLive > 150), 'memory.source'); //// REIMPLEMENT
        var candidates = _.filter(sources, function(s) { for(x of dedicated_sources) {if(x == s.id) {return false;}} return true;});
        //console.log('Candidate = ' + candidates[0]);
        return candidates;
    },

    force_convert: function( creep ) {
        var mod = require('DedicatedHarvester');
        var candidate_sources = mod.getTarget( creep.room.name );
        if( candidate_sources[0] == undefined ) {
            return false;
        }
        creep.memory={role:'dedicated_harvester',home:creep.room.name,source:candidate_sources[0].id, working:false};
        return true;
    },

    create_jobs: function( roomName ) {
        room = Game.rooms[roomName];
        if( room == undefined ) {
            return undefined;
        }
        spawns = _.filter( Game.spawns, (s) => s.my == true && s.pos.roomName == roomName );
        if( spawns.length == 0 ) {
            return undefined;
        }
        sources = room.find( FIND_SOURCES, function(x) {
                                                ctr = x.pos.findClosestByPath( STRUCTURE_CONTAINER );
                                                if( ctr == undefined || x.pos.getRangeTo( ctr ) > 10) {
                                                    return false;
                                                } else {
                                                    return true;
                                                }
                                            });
        rV = {};
        for( s in sources ) {
            sH = {
                role: this.type,
                job: this.type + ":" + sources[s].id,
                min: 1,
                max: 1,
                priority: 90,
                options: {
                    source: sources[s].id
                },
                body: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE],
                spawns: _.map( spawns, (x) => x.id )
            };
            rV[sH.job] = sH;
        }
        return rV;
    },

    createBody: function( energy ) {
        var common = require('Common');
        var bodyT = [{part:WORK,quantity:4},{part:CARRY,quantity:2},{part:MOVE,quantity:2}];
        if( energy > 1000) {
            energy = 1050;
        }
        return common.createBody( bodyT, energy );
    },
    ///// THIS IS THE GITHUB VERSION!
    run: function( creep ) {
        common=require('Common');

        if( common.checkWorking( creep ) == true ) {
            var containers = _.filter( _.map(Game.structures, (x,y) => x), (x) => (x.structureType == STRUCTURE_CONTAINER) &&
                                                                                    _.sum(x.store) < x.storeCapacity );

            var structure = creep.pos.findClosestByPath( FIND_STRUCTURES, {
                filter: (x) => x.structureType == STRUCTURE_CONTAINER && _.sum( x.store ) < x.storeCapacity
            });
            console.log("Dedi "+creep.name + " transferring energy to " + structure + " of " + containers)
            if( structure != undefined ) {
                if( creep.transfer( structure, RESOURCE_ENERGY ) == ERR_NOT_IN_RANGE ) {
                    creep.moveTo( structure );
                }
                return OK;
            } else {
                // drop it nearby
                hvst = creep.pos.findClosestByPath( _.filter( Game.creeps, (x) => x.memory.role == 'harvester') );
                if( hvst != undefined ) {
                    if( creep.transfer( hvst, RESOURCE_ENERGY ) == ERR_NOT_IN_RANGE ) {
                        creep.moveTo( hvst );
                    }
                }
            }
        } else {
            source = Game.getObjectById( creep.memory.source );
            if( creep.harvest( source) < 0 ) {
                creep.moveTo( source );
            }
            return ERR_NOT_ENOUGH_ENERGY;
        }
    }
};

/*
 * Module code goes here. Use 'mod  ule.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('RemoteHarvester');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    common: require('Common'),
    type: 'remoteHarvester',
    min: function() {return 4;},
    max: function() {return 7;},
    max_energy: function() {return 1400;},
    min_energy: function() {return 1400;},
    spawn: function() {return Game.spawns.Spawn2;},
    work_sequence: function() {return ['upgrader'];},

    force_convert: function( creep, remote ) {
        creep.memory.target = remote;
        creep.memory.home=creep.room.name;
        creep.memory.role='remoteHarvester';
        return creep;
    },

    create_jobs: function( roomName ) {
        common = require('Common');
        jobs = {};
        if( common.roomInfo[roomName] != undefined &&
            common.roomInfo[roomName].workforce != undefined &&
            common.roomInfo[roomName].workforce.remoteHarvester != undefined ) {
            var job = {
                role: this.type,
                job: this.type + ":" + roomName,
                min: common.roomInfo[roomName].workforce.remoteHarvester,
                max: common.roomInfo[roomName].workforce.remoteHarvester,
                options: {target: roomName, working:true},
                priority: 50,
                body: this.createBody( this.max_energy() )
            };
            jobs[ job.job ] = job;
        }
        return jobs;
    },


    run: function( creep ) {
        common=require('Common');
        if( common.checkWorking( creep )) {
            var structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            // the second argument for findClosestByPath is an object which takes
            // a property called filter which can be a function
            // we use the arrow operator to define it
                filter: (s) => (s.structureType == STRUCTURE_SPAWN
                         || s.structureType == STRUCTURE_EXTENSION
                         || s.structureType == STRUCTURE_TOWER)
                         && s.energy < s.energyCapacity
             });
             var container = creep.pos.findClosestByPath( FIND_STRUCTURES, {
                 filter: (s) => (s.structureType == STRUCTURE_CONTAINER ||
                                s.structureType == STRUCTURE_STORAGE) &&
                                s.store[RESOURCE_ENERGY] < (s.storeCapacity - creep.carry[RESOURCE_ENERGY])
             });


             var link = creep.pos.findClosestByPath( FIND_STRUCTURES, {
                 filter: (x) => x.structureType == STRUCTURE_LINK &&
                                x.energyCapacity > x.energy
             });
             var structs = _.filter([container,structure,link], (x) => x != undefined );
             target = undefined;
             if( structure != undefined && creep.pos.getRangeTo( structure ) <= 10 ) {
                 target = structure;
             } else {
                 target = creep.pos.findClosestByPath( structs );
             }

            if( target != undefined ) {
                err = 0;
                if( (err = creep.transfer( target, RESOURCE_ENERGY )) == ERR_NOT_IN_RANGE ) {
                     creep.moveTo( target );
                } else if( err == 0 ) {
                    creep.memory.totalTransferred += creep.carry.energy;
                } else {
                    console.log( creep.name + " receiving " + err + " trying to transfer")
                }

            } else {
                if( creep.room.name != common.home ) {
                    creep.moveTo( Game.flags.Flag1 );
                } else {
                    console.log("***ERR: No target for remote harvester creep to transfer energy to!  Shurley shome mishtake.  Don't all me 'Shirley'!");
                }
            }

        } else {
            if (creep.room.name == creep.memory.target) {
                // find source
                var source_source = creep.pos.findClosestByPath( FIND_SOURCES, {
                    filter: (x) => x.pos.roomName == creep.memory.target && x.energy > 0
                } );
                var source_noenergy = creep.pos.findClosestByPath( FIND_SOURCES, {
                    filter: (x) => x.pos.roomName == creep.memory.target && x.energy == 0
                } );
                var source_dropped = creep.pos.findClosestByPath( FIND_DROPPED_RESOURCES, {
                    filter: (x) => x.resourceType == RESOURCE_ENERGY && x.pos.roomName == creep.memory.target
                } );
                var source_tombstone = creep.pos.findClosestByPath( FIND_TOMBSTONES, {
                  filter: (x) => x.pos.roomName == creep.memory.target && x.store[ RESOURCE_ENERGY ] > 0
                });
                var source = creep.pos.findClosestByPath( _.filter([source_source, source_dropped, source_tombstone], (x) => x != undefined));
                if( source == undefined ) {
                  source = source_noenergy;
                  source_source = source_noenergy;
                }
                if( source == source_source ) {
                    err = creep.harvest(source);
                } else if( source == source_dropped ) {
                    err = creep.pickup( source, RESOURCE_ENERGY );
                } else if( source == source_tombstone ) {
                    err = creep.withdraw( source, RESOURCE_ENERGY );
                } if( source == undefined ) {
                    console.log( creep.name + " cannot find source to mine in the room");
                    return;
                }
                if( err == ERR_NOT_IN_RANGE || err == ERR_NOT_ENOUGH_RESOURCES ) {
                    creep.moveTo( source );
                } else if( err < 0 ) {
                    console.log( "***ERR: Creep " + creep.name + " received error " + err + " while trying to acquire energy from source " + source);
                }
            }
            // if not in target room
            else {
                //console.log( creep.name + " moving to target room ***")
                this.moveToTargetRoom( creep );
            }
        }

    },

    moveToTargetRoom: function( creep ) {
        common = require('Common');
        var flag = Game.flags[common.roomInfo[creep.memory.target].flag];
        //flag = Game.flags.Flag1;
        var pos = flag.pos;

        console.log( creep.name+ " moving to room "+creep.memory.target+ " to " + flag.pos);

        if( flag == undefined ) {
            flag=Game.flags.Flag1;
        }
        var err;
        if((err = creep.moveTo(flag.pos))<0) {
            console.log("Remote Harvester " + creep.name + " returned " + err + " while trying to move!")
        }
    },

    createBody: function( eA ) {
        bodyTemplate=[{part:WORK,quantity:10}, {part:CARRY,quantity:10}, {part:MOVE,quantity:10}];
        body = require('Common').createBody( bodyTemplate, eA );
        return body;
    },

    createCreep: function( spawn, target, eA ) {
        mem = {role:'remoteHarvester', working:false, home:spawn.room.name, target:target};
        body = this.createBody( eA );
        if( body != undefined ) {
            return spawn.createCreep( body, undefined, mem);
        }
        return ERR_NOT_ENOUGH_RESOURCES;
    }
};

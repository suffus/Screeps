/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('RemoteHauler');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    
    type: 'remoteHarvester',
    min: function() {return 2;},
    max: function() {return 3;},
    work_sequence: function() {return ['upgrader'];},
    
    force_convert: function( creep, remote ) {
        creep.memory.target = remote;
        creep.memory.home=creep.room.name;
        creep.memory.role='remoteHarvester';
        return creep;
    },
    
    
    run: function( creep ) {
        common=require('Common');
        if( creep.name == 'Josiah' ) {
            //return;
        }
        
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
                                s.store[RESOURCE_ENERGY] < s.storeCapacity
             });
             var structs = _.filter([container,structure], (x) => x != undefined );
            var target = creep.pos.findClosestByPath( structs );
                 
                
            if( target != undefined ) {
                err = 0;
                if( (err = creep.transfer( target, RESOURCE_ENERGY )) == ERR_NOT_IN_RANGE ) {
                     creep.moveTo( target );  
                } else if( err == 0 ) {
                    creep.memory.totalTransferred += creep.carry.energy;
                }
            } else {
                if( creep.room.name != common.home ) {
                    creep.moveTo( Game.flags.Flag1);
                } else {
                    console.log("***ERR: No target for remote harvester creep to transfer energy to!  Shurley shome mishtake.  Don't all me 'Shirley'!");
                }
            } 
             
        } else {
            if (creep.room.name == creep.memory.target) {
                // find source
                var source_source = creep.pos.findClosestByPath( FIND_SOURCES, {
                    filter: (x) => x.pos.roomName == creep.memory.target
                } );
                var source_dropped = creep.pos.findClosestByPath( FIND_DROPPED_RESOURCES, {
                    filter: (x) => x.resourceType == RESOURCE_ENERGY && x.pos.roomName == creep.memory.target
                } );
                source_dropped = undefined;
                var source = creep.pos.findClosestByPath( _.filter([source_source, source_dropped], (x) => x != undefined));
                if( source == source_source ) {
                    err = creep.harvest(source);
                } else if( source == source_dropped ) {
                    err = creep.transfer( source, RESOURCE_ENERGY ); 
                } else if( source == undefined ) {
                    console.log( creep.name + " cannot find source to mine in the room");
                }
                if( err == ERR_NOT_IN_RANGE || err == ERR_NOT_ENOUGH_RESOURCES ) {
                    creep.moveTo( source );
                } else if( err < 0 ) {
                    console.log( "***ERR: Creep " + creep.name + " received error " + err + " while trying to acquire energy from source " + source);
                }
            }
            // if not in target room
            else {
                this.moveToTargetRoom( creep );
            }
        }
    
    },
    
    moveToTargetRoom: function( creep ) {
        
        var map = {
            'W12S45': Game.flags.Flag4,
            'W12S44': Game.flags.Flag6,
            'W11S45': Game.flags.Flag8
        };
        
        var flag = map[creep.memory.target];
        //flag = Game.flags.Flag1;
        var pos = flag.pos;
        
        console.log( creep.name+ " moving to room "+creep.memory.target+ " to " + flag.pos);
        
        if( flag == undefined ) {
            flag=Game.flags.Flag1;
        }
        var err;
        if((err = creep.moveTo(flag.pos, {maxOps:10000}))<0) {
            console.log("Remote Harvester " + creep.name + " returned " + err + " while trying to move!")
        }
    },
    
    createCreep: function( spawn, target ) {
        mem = {role:'remoteHarvester', working:false, home:spawn.room.name, target:target};
        return spawn.createCreep( [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], undefined, mem);
    }

};
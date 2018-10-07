/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('StructurePlanner');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    runRoom: function( room ) {
      return;
        common = require('Common')
        if( Math.random() < 0.2 ) {
            if( Game.rooms[room] == undefined ) { ///// no structures there
                return;
            }
            structures = Game.rooms[room].find( FIND_STRUCTURES )
            repair_structures_urgent = structures.filter( (x) => x.structureType != STRUCTURE_WALL
                  && x.structureType != STRUCTURE_RAMPART && x.hits/x.hitsMax < 0.6
                  && Memory.deprecatedStructures[x.id] == undefined )
            if( Memory.urgentRepairs == undefined ) {
                Memory.urgentRepairs = {}
            }
            for( let s of _.filter( Memory.urgentRepairs, (x) => x!=undefined && x.pos != undefined && x.pos.roomName == room )) {
                let val = Game.getObjectById( s.id )
                if( val == null ) {
                    console.log("Cannot get structure for " + s.id)
                } else {
                    if( val.hits / val.hitsMax > 0.85 ) {
                        Memory.urgentRepairs[ s.id ] = undefined
                    }
                }

            }

            repairers = _.filter( Game.creeps, (x) => x.memory.role == 'repairer' );
            for( s of repair_structures_urgent ) {
                if( Memory.urgentRepairs[s.id] == undefined) {
                    Memory.urgentRepairs[ s.id ] = {pos:s.pos, repairer:undefined, id:s.id}
                }
                spec = Memory.urgentRepairs[ s.id ]
                let unscheduled_repairs = []
                if( repairers.length > 0 ) {
                    if( spec.repairer == undefined || Game.creeps[spec.repairer] == undefined) {
                        if( spec.pos == undefined ) {
                            console.log( "UNDEFINED POSITION FOR STRUCTURE " + Game.getObjectById( s.id ))
                            continue;
                        } else {
                            let pos = spec.pos;
                            let rPos = new RoomPosition( pos.x, pos.y, pos.roomName );
                            let repairer = rPos.findClosestByRange( repairers )
                            if( repairer == null || repairer == undefined ) {
                                repairer = repairers[repairers.length - 1]
                            }
                            if( repairer != undefined && repairer != null ) {
                                spec.repairer = repairer.name
                            }
                            console.log( "$$$$$$$$$ REPAIRER $$$$$$$$$$$$ Assigning repairer for " + Game.getObjectById(spec.id) + " to " + repairer + " (of " + repairers.length + ")")
                        }
                    }
                }
            }
        }
    }

};

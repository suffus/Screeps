/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('StructurePlanner');
 * mod.thing == 'a thing'; // true
 */

const common = require('Common')

module.exports = {
    runRoom: function( room ) {
        if( Math.random() < 0.1 ) {
            if( Game.rooms[room] == undefined ) { ///// no structures there
                return;
            }
            structures = Game.rooms[room].find( FIND_STRUCTURES )
            if( Memory.rooms === undefined ) {
                Memory.rooms = {}
            }
            if( Memory.rooms[room] == undefined ) {
                Memory.rooms[room] = {
                    structures: []
                }
            }
            Memory.rooms[room].structures=[]
            for( s of structures ) {
                Memory.rooms[room].structures.push( {type: s.structureType, pos: {x: s.pos.x, y: s.pos.y}, id: s.id})
            }
            Memory.rooms[room].structures = Memory.rooms[room].structures.sort( (x,y) => common.comparePos(x.pos, y.pos) )

            repair_structures_urgent = structures.filter( (x) => x.structureType != STRUCTURE_WALL
                  && x.structureType != STRUCTURE_RAMPART && x.hits/x.hitsMax < 0.6
                  && Memory.deprecatedStructures[x.id] == undefined )
            if( Memory.urgentRepairs == undefined ) {
                Memory.urgentRepairs = {}
            }
            for( let s of _.filter( Memory.urgentRepairs, (x) => x!=undefined && x.pos != undefined && x.pos.roomName == room )) {
                let val = Game.getObjectById( s.id )
                if( val == null || val == undefined ) {
                    console.log("Cannot get structure for " + s.id);
                    Memory.urgentRepairs[ s.id ] = undefined;
                } else {
                    if( val.hits / val.hitsMax > 0.85 ) {
                        Memory.urgentRepairs[ s.id ] = undefined;
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

/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Common');
 * mod.thing == 'a thing'; // true
 */

module.exports = {

    home: 'E8S21',
    roomInfo: {
        'E8S21': {
            flag:'Flag1',
            defenceStrategy:'soldier',
            workforce: {
                harvester : 2,
                upgrader: 2,
                builder: 2,
                repairer: 1,
                brickie: 1
            },
            upgraderSource: '5ee6d5a972b57d67f2949fc3',
            workforcePlanB: [{harvester:2},{harvester:2,builder:1},{harvester:2,builder:1,upgrader:1}],
            regions: {
                spawnRegion: {type: 'circle', pos: {x:21, y:21}, radius:10}
            },
            reservedStructures: {'5ee6d5a972b57d67f2949fc3': ['upgrader']},
            links: {
                'from':['5ee836388e5ccb95635224fa'],
                to:['5ee87f151be94edefc6ccd3a']
            }

        },
        'E7S22': {
            flag: 'Flag4',
            workforce: {
                builder: 1
            }
        },
        'E8S22' : {
            flag: 'Flag2',
            workforce: {
                remoteHarvester: 1,
                reserver: 1
            }
        },
        'E8S23' : {
            flag: 'Flag3',
            lootable: true
        }
     },

     getWorkforce: function( room, worker ) {
         if( this.roomInfo[room] ) {
             if( this.roomInfo[room].workforce ) {
                 return this.roomInfo[room].workforce[worker]
             }
         }
         return 0
     },

     getFlag: function( rm ) {
       if( this.roomInfo[rm] ) {
         return rm.flag
       }
       return undefined
     },
     clearParking: function( creep ) {
       creep.memory.parkingPlace = undefined
     },
     getOutOfTheWay: function( creep, struct ) {
       if( !creep.memory.parkingPlace ) {
         if( struct === undefined ) {
           struct = creep
         }
         let sq = this.findClearSquare( struct, 2 )
         if( sq && creep.pos.getRangeTo( sq ) < 5 ) {
           creep.memory.parkingPlace = sq
         }
       }
       if( creep.memory.parkingPlace ) {
         creep.moveTo( creep.memory.parkingPlace.x, creep.memory.parkingPlace.y )
       }
     },

     findClearSquare: function( target, range ) {
        let square = this.getLocalData( target, range )
        for( let s of Object.values(square) ) {
            if( s.structures.length === 0 && s.terrain === 0) {
                return s.pos
            }
        }
        return undefined
     },

     getLocalData: function( pos, delta ) {
         if( pos.pos !== undefined ) {
             pos = pos.pos
         }
         const terrain = new Room.Terrain( pos.roomName );
         let rV = {}
         for( let i = -delta; i<=delta; i++ ) {
             for( let j = -delta; j<=delta; j++ ) {
                 if( i+pos.x >= 1 && i+pos.x <=48 && j+pos.y >= 1 && j+pos.y <= 48 ) {
                     let terra = terrain.get(i+pos.x,j+pos.y)
                     let pPos = new RoomPosition( i+pos.x, j+pos.y, pos.roomName )
                     let point = {
                         pos: pPos,
                         terrain: terra,
                         structures: this.findStruct( pPos )
                     }
                     rV[pPos] = point

                 }

             }
         }
         return rV

     },

     comparePos: function( pos1, pos2 ) {
         let dX = pos1.x - pos2.x
         if( dX != 0 ) {
             return dX
         }
         return pos1.y - pos2.y
     },

    findStruct: function( pos ) {
        let sA = Memory.rooms[pos.roomName].structures
        if( sA !== undefined && sA.length > 0 ) {
            if( this.comparePos(sA[0].pos, pos ) > 0 ) {

                return []
            }

            let lo = 0
            let hi = sA.length-1
            let dP = 0
            while( lo < hi ) {
                let mid = Math.floor((lo + hi)/2)
                dP = this.comparePos( sA[mid].pos, pos )
                if( dP < 0  ) {  /// mid is strictly before pos
                    lo = mid+1
                } else {
                    hi = mid
                }
            }

            let rV = []
            while( lo < sA.length && this.comparePos( sA[lo].pos, pos ) === 0 ) {
                rV.push( sA[lo].id )
                lo++
            }
            return rV
        }
        return []
    },

    createWorkerBody: function( energyAvailable ) {
        if( energyAvailable == 300 )  {
            return [WORK,WORK,CARRY,MOVE];
        }
        if( energyAvailable > 1200 ) {
            energyAvailable = 1200;
        }
        bP = [{part:WORK,quantity:6},{part:CARRY,quantity:6},{part:MOVE,quantity:6}];
        return this.createBody( bP, energyAvailable );
    },

    bodyPartCost : {
        'work':100,'carry':50,'move':50,'attack':80,'ranged_attack':150,'tough':10,'heal':250,'claim':600
    },

    isBlockingSource( creep ) {
          sources = Game.rooms[creep.pos.roomName].find( FIND_SOURCES )
          for( let s of sources ) {
              if( creep.pos.getRangeTo( s ) === 1   ) {
                  console.log( "Creep " + creep.name + " is blocking source" )
                  return true
              }
          }
          return false
    },

    findRoomEnergySource( roomName ) {
        sources = Game.rooms[roomName].find(FIND_SOURCES);
        let rnd = Math.floor(Math.random() * sources.length)
        if( sources.length === 0  ) {
            console.log("** No sources found in " + roomName)
        }
        let rV = sources[rnd].id
        //console.log("Returning source id " + rV )
        return rV
    },

    createBody: function( bodyPrototype, energyAvailable ) {
        let bodyPartCost = this.bodyPartCost;
        let totalCost = 0;
        _.map( bodyPrototype, function(x) {totalCost += x.quantity * bodyPartCost[x.part];} );
        let scaleFactor = energyAvailable/totalCost;
        let body = [];
        //console.log("cost="+totalCost+", energy="+energyAvailable+", scaleFactor = "+scaleFactor+", WorkCost="+bodyPartCost[WORK]+", firtPart = "+bodyPrototype[0].part);
        for( let unit of bodyPrototype ) {
            let units = Math.floor( unit.quantity*scaleFactor );
            if( units < 1 ) {
                let bps = _.map( bodyPrototype, (x) => x.part+":"+x.quantity).join(",")
                console.log("Cannot create body prototype - not enough energy: " + bps);
                return [];
            }
            for( let i = 0; i < units; i++ ) {
                body.push( unit.part );
            }
        }
        let bCost = 0;
        _.map(body, function(x) {bCost += bodyPartCost[x]});
        console.log("Body = " + body.join() + ", cost = " + bCost);
        return body;
    },

    calculateBodyCost: function( body ) {
        return _.sum( body, (x) => this.bodyPartCost[x]);
    },

    creepsGotoFlag: function( creeps, flag ) {
        for( let c of creeps ) {
            c.memory.targetFlag = flag;
        }
        return OK;
    },

    roleGotoFlag: function( role, num, flag ) {
        if( !(num>0) ) {
            return ERR_INVALID_ARGS;
        }
        if( Game.flags[flag] == undefined ) {
            return ERR_INVALID_ARGS;
        }
        let creeps = _.filter( Game.creeps, (x) => x.memory.role == role && x.pos.roomName == this.home && x.memory.targetFlag == undefined);
        let assigned_creeps = [];
        if( creeps.length >= num ) {
            for( let i=0; i<num; i++ ) {
                assigned_creeps.push( creeps.pop() );
            }
        } else {
            return ERR_NOT_ENOUGH_RESOURCES;
        }
        _.map( assigned_creeps, (x) => x.memory.targetFlag = flag );
        _.map( assigned_creeps, (x) => x.memory.sourceTarget = undefined );
        return OK;
    },

    gotoFlag: function( creep, strict ) {
        if( creep.memory.targetFlag != undefined ) {
           console.log(creep.name + " has a target Flag");
           creep.memory.sourceTarget = undefined
           if( creep.room.name == common.home ) {
               if( creep.carry.energy < creep.carry.energyCapacity ) {
                   creep.memory.working = false;
                   this.fillHerUp( creep );
                   return ERR_BUSY;
               }
           }
           let flag = Game.flags[creep.memory.targetFlag];
           if( flag == undefined ) {
               console.log("Invalid Flag "+creep.memory.targetFlag+" for "+creep.name);
               return ERR_INVALID_TARGET;
           }
           if( creep.room.name == flag.pos.roomName ) {
               if( creep.memory.fCtr == undefined ) {
                   creep.memory.fCtr = 5;
                   creep.moveTo( flag );
                    return ERR_BUSY;
               }
               if( --creep.memory.fCtr > 0 ) {
                   creep.moveTo( flag );
                   return ERR_BUSY;
               }
               creep.memory.fCtr = undefined;
               creep.memory.targetFlag = undefined;
               creep.memory.working = true;
               return OK;
           } else {
               err = creep.moveTo( flag  );
               if( err != 0 ) {
                   console.log( creep.name + " could not move to flag " + flag +", received return code " + err);
               }
               return ERR_BUSY;
           }
       }
       return OK;
    },

    getOppositeDirection: function( dir ) {
        map = {
                        TOP:BOTTOM,
                        TOP_RIGHT:BOTTOM_LEFT,
                        TOP_LEFT:BOTTOM_RIGHT,
                        RIGHT:LEFT,
                        LEFT:RIGHT,
                        BOTTOM_RIGHT:TOP_LEFT,
                        BOTTOM_LEFT:TOP_RIGHT,
                        TOP:BOTTOM,
                        BOTTOM:TOP
        };
        return map[dir];

    },


    checkWorking: function( creep ) {
        if( creep.memory.working == undefined ) {
            creep.memory.working = true;
        }

        if (creep.memory.working == true && creep.store[RESOURCE_ENERGY] == 0) {
            // switch state

            creep.memory.working = false;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            // switch state
            creep.memory.working = true;
            creep.memory.sourceTarget = undefined;
            if( creep.memory.role !== "dedicated_harvester" && !creep.memory.heavyVehicle ) {
                creep.moveTo( Game.flags.Flag2); // move away from source
            }
        }
        return creep.memory.working;
    },

    setSource: function( creep, src ) {
        sourceID = undefined;
        if( src != undefined ) {
            sourceID = src.id;
        }
        creep.memory.sourceTarget = sourceID;
    },

    isAvailableAsSupply: function( creep, structure ) {
        let info = this.roomInfo[ structure.pos.roomName ]
        if( !info || !info.reservedStructures || !info.reservedStructures[structure.id]) {
            return true
        }
        for( let r of info.reservedStructures[structure.id]) {
            if( r === creep.memory.role ) {
                return true
            }
        }
        if( info.reservedStructures[structure.id].filter( (x) => {creep.memory.role == x}).length > 0) {
            return true
        }
        return false
    },

    fillHerUp: function( creep, sourceID_in, roomName, sourceFilter ) {
        let canWork = false
        creep.body.map( (x) => {if( x.type == WORK && x.hits > 0 ){canWork = true}} )
        if( creep.memory.role === "harvester" ) {
            canWork = false;
        }

        if( creep.carry.energy == creep.carryCapacity ) {
            return ERR_FULL;
        }
        var sourceID = sourceID_in;
        if( sourceID === undefined ) {
            sourceID = creep.memory.sourceTarget;
        }
        console.log("Source ID = " + sourceID )
        var source = undefined;
        if( sourceID != undefined ) {
            source = Game.getObjectById( sourceID );
            if( source == undefined ) {
                console.log("**** source dissapeared for "+sourceID);
                source = undefined;
            } else {
                console.log("Found Source")
                if( sourceID_in == undefined && (source.energy != undefined && source.energy == 0) || (source.store != undefined && source.store[RESOURCE_ENERGY] == 0)) {
                    source = undefined;
                }
            }
            this.setSource( creep, source );
        }
        var source_container, source_source, source_dropped, source_tombstone, source_link, source_storage;
        if( source == undefined ) {
            source_container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (x) => {
                        return (x.structureType == STRUCTURE_CONTAINER
                        && this.isAvailableAsSupply( creep, x )
                        && x.store[RESOURCE_ENERGY] > 0);
                    }
            });
            if( (canWork && creep.memory.role != 'upgrader') && creep.pos.roomName == this.home) {
              //  source_container = undefined;
            }

            if( canWork ) {
                source_source = creep.pos.findClosestByPath( FIND_SOURCES_ACTIVE );
            }
            source_dropped = creep.pos.findClosestByPath( FIND_DROPPED_RESOURCES, {
                filter: (r) => r.resourceType == RESOURCE_ENERGY
            } );
            //source3 = undefined;
            source_tombstone = creep.pos.findClosestByPath( FIND_TOMBSTONES, {
                filter: (x) => x.store[RESOURCE_ENERGY] > 0
            } );

            source_link = creep.pos.findClosestByPath( FIND_STRUCTURES, {
                filter: (x) => x.structureType == STRUCTURE_LINK &&
                                x.energy > 0
            });
            source_storage = undefined;
            if( Memory.useStorage > 0 && creep.memory.role == 'harvester') {
                source_storage = creep.pos.findClosestByPath( FIND_STRUCTURES, {
                    filter: (x) => x.structureType == STRUCTURE_STORAGE && x.store.energy > 0
                });
            };
            sources = _.filter( [source_container,source_dropped,source_tombstone,source_link], function(x) {return x!=undefined;})
            if( sourceFilter != undefined ) {
                sources = _.filter( sources, sourceFilter )
                ss_a = _.filter( [source_source], sourceFilter)
                if( ss_a.length == 0 ) {
                    source_source = undefined
                }
            }
            source = creep.pos.findClosestByPath( sources );
            if( source_source ) {
                if( source ) {
                    let d1 = creep.pos.getRangeTo( source_source )
                    let d2 = creep.pos.getRangeTo( source )
                    if( d2 - d1 > 5 ) {
                        source = source_source
                    }
                } else {
                    source = source_source

                }
            }
            if( (source == undefined || creep.pos.getRangeTo(source) > 20)  && source_storage != undefined ) {
                source = source_storage;
            }
        } else {
            console.log("Getting Source "+source);
            if( source.store != undefined ) {
                source_container = source;
            } else if( source.energyCapacity != undefined ) {
                source_source = source;
            } else {
                source_dropped = source;
            }
        }
        if( source !=undefined ) {
            //console.log( creep.name + " going to source " + source.pos.x + " " + source.pos.y);
            var err = 99;
            if( source == source_source ) {
                err = creep.harvest( source );
            } else if( source == source_container || source == source_tombstone || source == source_storage || source == source_link ) {
                err = creep.withdraw( source, RESOURCE_ENERGY );
            }  else if( source == source_dropped ) {
                err = creep.pickup( source, RESOURCE_ENERGY );
            } else {
                console.log("***ERRRR NO SOURCE!");
                err = ERR_NOT_FOUND;
            }
            if( err == 0 ) {
                this.setSource( creep, source );
            } else if( err == ERR_NOT_IN_RANGE ) {
                creep.moveTo( source );
            } else {
                //console.log("****LOG - energy acquisition call returned "+err+" for " + creep + " ("+creep.pos+") " + " for "+source+" ("+source.pos+")");
                creep.moveTo( Game.flags.Flag1)
                creep.memory.sourceTarget = undefined
            }
            if( err == ERR_FULL ) { ////// dunno how this can be but will fuck the creep up
                err = ERR_INVALID_ARGS;
            }
            return err;
           //console.log( "err1=" + err1 + ", err2="+err2);
        } else {
            //console.log("No sources for "+creep.name);
            source = Game.getObjectById( creep.memory.allocatedSource || creep.memory.sourceTarget );
            if( source != undefined ) {
                creep.moveTo( source );
                return ERR_NOT_IN_RANGE;
            } else {
                return ERR_NOT_ENOUGH_RESOURCES;
            }
        }
    },

    isInRegion: function( pos, r ) {
        rInfo = this.roomInfo[pos.roomName].regions;
        if( rInfo == undefined ) {
            return false;
        }
        region = rInfo[r];
        if( region == undefined ) {
            return false;
        }
        if( region.type == 'circle' ) {
            d = Math.sqrt( (pos.x - region.pos.x)*(pos.x-region.pos.x) + (pos.y - region.pos.y)*(pos.y - region.pos.y) );
            if( d < region.radius ) {
                return true;
            }
            return false;
        }
        return false;
    },

    listCreeps: function( ) {
        for( let c in Game.creeps ) {
            creep = Game.creeps[c];
            console.log( creep.name + " = " + creep.id)
        }
    }


};

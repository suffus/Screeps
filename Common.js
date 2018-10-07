/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Common');
 * mod.thing == 'a thing'; // true
 */

module.exports = {


    roomFlags: {'W13S12':'Flag1', 'W12S12':'Flag2', 'W12S13':'Flag3', 'W12S13':'Flag5'},
    remoteRooms: ['W12S12','W12S13','W11S13'],
    rooms: ['W13S12','W12S12','W12S13','W11S13', 'W11S12'],

    home: 'W13S12',
    roomInfo: {
        'W13S12':{
            flag: 'Flag1',

            workforce: {
                'dedicated_harvester':2,
                'harvester':2,
                'upgrader':5,
                'repairer':1,
                'brickie':1,
                'defender':1,
                'builder':'calculate'
            },
            links: {
                from:['5b9964c1c84f904d3ccaf2dc','5b9e98683b50fb23e20a6407'],
                to:'5b9962df0417171556aa9ec4'
            },
            regions: {
                'spawnRegion': {type:'circle',pos:{x:12,y:8},radius:12},
                'controllerRegion': {type:'circle',pos:{x:30,y:40},radius:10}
            }
        },
        'W12S12':{
            flag:'Flag2',
            workforce: {
                //'remoteHarvester':2,
                'upgrader':4,
                'repairer':'calculate',
                'builder':'calculate'
            },
            links:{
                from:['5ba22049cb444c51a999611b'],
                to:'5ba21d0f678e5b460f94737b'
            },
            regions: {
                spawnRegion: {type: 'circle', pos: {x: 10, y: 10}, radius: 10}
            }
        },
        'W12S13': {
            flag:'Flag3',
            defenceStrategy:'soldier',
            workforce: {
                remoteHarvester : 1,
                builder: 'calculate',
                repairer: 'calculate'
            }
        },
        'W11S13': {
            flag:'Flag5',
            defenceStrategy:'soldier',
            workforce: {
                remoteHarvester : 1,
                builder: 'calculate',
                repairer: 'calculate'
            }
        },
        'W11S12': {
            flag: 'Flag6',
            defenceStrategy:'soldier',
            workforce: {
                remoteHarvester : 2
            }
        },
        'W11S14': {
            flag:'Flag7',
            defenceStrategy:'soldier',
            workforce: {
                remoteHarvester:1
            }
        },
        'W14S12': {
            flag: 'Flag8',
            reserve: true,
            defenceStrategy: 'soldier',
            workforce: {
              remoteHarvester: 2
            }
        },
        'W14S13': {
          flag: 'Flag9',
          defenceStrategy:'soldier',
          workforce: {
            upgrader: 2,
            remoteHarvester: 1
          }
        }
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


    createBody: function( bodyPrototype, energyAvailable ) {
        bodyPartCost = {
            'work':100,'carry':50,'move':50,'attack':80,'ranged_attack':150,'tough':10,'heal':250,'claim':600
        };
        totalCost = 0;
        _.map( bodyPrototype, function(x) {totalCost += x.quantity * bodyPartCost[x.part];} );
        scaleFactor = energyAvailable/totalCost;
        body = [];
        //console.log("cost="+totalCost+", energy="+energyAvailable+", scaleFactor = "+scaleFactor+", WorkCost="+bodyPartCost[WORK]+", firtPart = "+bodyPrototype[0].part);
        for( unit of bodyPrototype ) {
            units = Math.floor( unit.quantity*scaleFactor );
            if( units < 1 ) {
                bps = _.map( bodyPrototype, (x) => x.part+":"+x.quantity).join(",")
                console.log("Cannot create body prototype - not enough energy: " + bps);
                return [];
            }
            for( i = 0; i < units; i++ ) {
                body.push( unit.part );
            }
        }
        bCost = 0;
        _.map(body, function(x) {bCost += bodyPartCost[x]});
        bS = body.join();
        console.log("Body = "+ bS+", cost = "+bCost);
        return body;

    },

    calculateBodyCost: function( body ) {
        return _.sum( body, (x) => this.bodyPartCost[x])
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

        if( creep.room.name != this.home) {
            if( Memory.defcon > 0 ) {
                creep.moveTo( Game.flags.Flag1 );
                return ERR_BUSY;
            }
        }

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

        if (creep.memory.working == true && creep.carry.energy == 0) {
            // switch state

            creep.memory.working = false;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            // switch state
            creep.memory.working = true;
            creep.memory.sourceTarget = undefined;
            creep.moveTo( Game.flags.Flag2); // move away from source
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

    fillHerUp: function( creep, sourceID_in, roomName, sourceFilter ) {
        if( creep.carry.energy == creep.carryCapacity ) {
            return ERR_FULL;
        }
        var sourceID = sourceID_in;
        if( sourceID == undefined ) {
            sourceID = creep.memory.sourceTarget;
        }

        var source = undefined;
        if( sourceID != undefined ) {
            source = Game.getObjectById( sourceID );
            if( source == undefined ) {
                console.log("**** source dissapeared for "+sourceID);
                source = undefined;
            } else {
                if( sourceID_in == undefined && (source.energy != undefined && source.energy == 0) || (source.store != undefined && source.store[RESOURCE_ENERGY] == 0)) {
                    source = undefined;
                }
            }
            this.setSource( creep, source );
        }
        var source_container, source_source, source_dropped, source_tombstone, source_link, source_storage;
        if( source == undefined ) {
            source_container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: function(x) {
                        return (x.structureType == STRUCTURE_CONTAINER &&
                        x.store[RESOURCE_ENERGY] > 0);
                    }
            });
            if( (creep.memory.role != 'harvester' && creep.memory.role != 'upgrader') && creep.pos.roomName == this.home) {
              //  source_container = undefined;
            }

            if( creep.memory.role != 'harvester') {
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
            sources = _.filter( [source_container,source_source,source_dropped,source_tombstone,source_link], function(x) {return x!=undefined;})
            if( sourceFilter != undefined ) {
                sources = _.filter( sources, sourceFilter )
            }
            source = creep.pos.findClosestByPath( sources );
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
                console.log("****LOG - energy acquisition call returned "+err+" for " + creep + " ("+creep.pos+") " + " for "+source+" ("+source.pos+")");
                creep.moveTo( Game.flags.Flag1)
                creep.memory.sourceTarget = undefined
            }
            if( err == ERR_FULL ) { ////// dunno how this can be but will fuck the creep up
                err = ERR_INVALID_ARGS;
            }
            return err;
           //console.log( "err1=" + err1 + ", err2="+err2);
        } else {
            console.log("No sources for "+creep.name);
            source = Game.getObjectById( creep.memory.allocatedSource );
            if( source != undefined ) {
                creep.moveTo( source );
                return ERR_NOT_ENOUGH_RESOURCES;
            } else {
                return ERR_NOT_ENOUGH_RESOURCES;
            }
        }
    },


    buildAndRepairRemote: function( role, r ) {
        var remotes = [];
        for( rm in this.roomInfo ) {
            if( rm != this.home ) {
                remotes.push( rm );
            }
        }

        if( r == undefined ) {
            r = remotes[ Math.floor( Math.random() * remotes.length )];

        }
        var room = Game.rooms[r];
        flag = this.roomInfo[r].flag;

        if( role == undefined && room != undefined && room.controller != undefined && room.controller.my == true && (Game.time % 2) == 0 ) {
            role = 'upgrader';
        } else {
            if( role == undefined ) {
                role = 'repairer';
            }
        }
        creeps = _.filter( Game.creeps, (x) => x.memory.role == role && x.pos.roomName == this.home );
        if( creeps != undefined && creeps[creeps.length - 1] != undefined ) {
            creep = creeps[creeps.length - 1];
            console.log("**** Sending " + creep.name + " to flag " + flag + " as a " + role);
            creep.memory.working  = true;
            creep.memory.targetFlag = flag;
        } else {
            console.log( "**** Remote repairing - no creeps available")
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

/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Defence');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    name:'Defence',
    runRoom: function(roomName) {
        common=require('Common');
        var room = Game.rooms[roomName];
        if( room == undefined ) {
            console.log("**** NO ROOM " + roomName + " FOUND IN " + this.name)
            return;
        }
        //// LOCAL ONLY NOT GITHUB
        var hostiles = room.find(FIND_HOSTILE_CREEPS);
        if(hostiles.length > 0) {
            var username = hostiles[0].owner.username;
            Game.notify(`User ${username} spotted in room ${roomName} at ` + Game.time);
            var towers = Game.rooms[roomName].find(
                FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
            towers.forEach(tower => tower.attack(hostiles[0]));
            if( towers.length == 0 ) {
                this.registerHostiles( room )
            }
        }
    },
    registerHostiles: function( room ) {
        var hostiles = room.find( FIND_HOSTILE_CREEPS )
        if( Memory.hostiles == undefined ) {
            Memory.hostiles = [];
        }
        hostiles.forEach( (x) => Memory.hostiles.push(x.id));
    },
    beforeRoom: function( ) {
        Memory.hostiles = [];
        if( Memory.defcon == undefined ) {
            Memory.defcon = 0;
        }
    },
    afterRoom: function( ) {
        common = require('Common');
        var soldiers = _.filter(Game.creeps, (x) => x.memory.role == 'defender');
        if( Memory.hostiles != undefined && Memory.hostiles.length > 0 ) {
            console.log( "DEFCON1 *****************************************************")
            this.setDefcon(1);
            hostiles = _.filter(Memory.hostiles.map( (x) => Game.getObjectById( x )), (x) => x != undefined );
            if( hostiles.length == 0 ) {
                console.log( )
                this.setDefcon( 0 );
            }
            hInfo = {};
            hostiles.forEach( function(x) {if( hInfo[x.pos.roomName]==undefined ) {hInfo[x.pos.roomName] = []}; hInfo[x.pos.roomName].push( x )} )
            soldierRooms = []
            for( rm in hInfo ) {
                if( common.roomInfo[rm] != undefined ) {
                    if( common.roomInfo[rm].defenceStrategy == 'soldier' ) {
                        soldierRooms.push( common.roomInfo[rm].flag );
                    }
                }
            }
            if( soldierRooms.length > 0 ) {

                var n = 0;
                for( soldier of soldiers ) {
                    flag = soldierRooms[n]
                    if( flag != undefined ) {
                        soldier.memory.station = flag;
                    }
                    n++
                    if( n >= soldierRooms.length ) {
                        n = 0;
                    }
                }
            }
        } else {
            this.setDefcon( 0 );
            _.map(soldiers, (x) => x.memory.station = Memory.barracks);
        }
    },
    setDefcon: function( level ) {
        if( Memory.defcon == undefined ) {
            Memory.defcon = 0;
        }
        if( level > Memory.defcon ) {
            if( Memory.useStorage < 1000 ) {
                Memory.useStorage += 600 * level;
            }
            Memory.numDefconEvents++;
        }
        Memory.defcon = level;
    }
};

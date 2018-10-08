/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Defender');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    type: 'defender',
    min: function() {return Memory.defcon + 1;},
    max: function() {return Memory.defcon + 1 ;},
    min_energy: function( ) {
        return 1200;
    },
    max_energy: function() {return 2300;},
    work_sequence: function() {return [];},

    createBody: function( energy ) {
        common = require('Common');
        bodyP =  [{part: MOVE, quantity:16},{part:ATTACK,quantity: 12},{part:HEAL,quantity:2}];
        return common.createBody( bodyP, energy );
    },

    create_jobs: function( room ) {
        if( room != require('Common').home ) {
            return {};
        }
        nC = 1;
        pri = 5;
        if( Memory.defcon > 0 ) {
            nC = Memory.defcon + 1;
            pri = 95;
        }
        rv = {
            defender: {
                role: 'defender',
                job: 'defender',
                min: nC,
                max: nC,
                body: this.createBody( 2300 ),
                priority: pri,
                options: {
                    station: Memory.barracks
                }
            }
        };
        return rv;
    },

    run: function( creep ) {
        common = require('Common');
        //return;

        var hostile = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
        if( hostile == undefined && Memory.hostiles != undefined && Memory.hostiles.length > 0 ) {
            hostile = Game.getObjectById(Memory.hostiles[0])
        }


        if( hostile != undefined ) {
            var username = hostile.owner.username;
            creep.memory.reported_hostile_pos = hostile.pos;
            console.log('******* HOSTILES IDENTIFIED IN ' + creep.pos.roomName + " by " + creep.name + " in " + hostile.pos);
            Game.notify(`User ${username} spotted now identified`);

            if(creep.attack( hostile) == ERR_NOT_IN_RANGE || creep.rangedAttack(hostile) == ERR_NOT_IN_RANGE) {
                if( creep.pos.getRangeTo( hostile ) > 0 && (creep.memory.rampart == undefined) ) {
                    err = creep.moveTo( hostile);
                    creep.heal(creep);
                    console.log( "Creep " + creep.name + " trying to move to hostile returned " + err)
                }
                return;
            }
            if( creep.memory.rampart == undefined && creep.pos.getRangeTo( hostile ) < 2 ) {
                dir = creep.pos.getDirectionTo( hostile );
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
                revdir = map[dir];
                creep.move( dir );
            }
        } else {
            //creep.moveTo( Game.flags['Flag5']);
            //return;
            if( creep.memory.reported_hostile_pos != undefined && creep.memory.reported_hostile_pos.roomName != creep.pos.roomName ) {
                pos = creep.memory.reported_hostile_pos;
                err = creep.moveTo( new RoomPosition( pos.x, pos.y, pos.roomName) );
                console.log( creep.name + " defender moving to reported hostiles in room " + creep.memory.reported_hostile_pos.roomName + ", move returned " + err  );
                return;
            } else {
                creep.memory.reported_hostile_pos = undefined;
            }

            my_damaged_creeps = _.filter( Object.values(Game.creeps), (x) => _.sum( _.map( x.body, (z) => 100-z.hits)) > 50  );

            dcp = creep.pos.findClosestByRange( my_damaged_creeps ); // may be memy_damaged_creeps

            if( dcp != undefined ) {
                creep.memory.damagedTarget = dcp.id

            }
            if( creep.memory.damagedTarget != undefined ) {
                dcp = Game.getObjectById( creep.memory.damagedTarget )
                if( dcp != undefined && _.sum( _.map( dcp.body, (z) => 100-z.hits)) < 10 ) {
                    dcp = undefined;
                }
                if( dcp == undefined ) { // for whatever reason
                    creep.memory.damagedTarget = undefined
                } else {
                    if( creep.heal( dcp ) == ERR_NOT_IN_RANGE ) {
                        creep.moveTo(dcp);
                    }
                    return;
                }
            }


            moveSet = _.filter( creep.body, (x) => x.type == MOVE );//
            moveScore = _.sum(moveSet,'hits');
            console.log(creep.name + " has moveScore of " +moveScore);
            if( moveScore < 500 ) {
                //creep.memory.role = 'invalid';
            }

            if( creep.memory.rampart != undefined ) {
                rampart = Game.getObjectById( creep.memory.rampart );
                if( creep.moveTo( rampart ) == 0 ) {

                }
                console.log( creep.name + ' moving to rampart ' + creep.memory.rampart);
                return;
            }


            if( creep.memory.station == undefined ) {
                creep.memory.station = Memory.barracks;
            }
            flag = Game.flags[creep.memory.station];
            creep.moveTo( flag );
            //creep.moveTo( Game.getObjectById('5b8a1c05b2fa0416d2428450'));
            //creep.attack( Game.getObjectById( '5b8a1c05b2fa0416d2428450'));
        }
    }
};

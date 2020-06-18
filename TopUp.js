/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('TopUp');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    type: 'upgrader',
    min: function() {return 1;},
    max: function() {return 2;},
    min_energy: function() {return 1100;},
    max_energy: function() {return  1100;},
    work_sequence: function() {return ['slacker'];},

    createBody: function( e ) {
        common=require('Common');
        if( e === 100 ) {
            return [WORK,WORK,CARRY,MOVE]
        }
        if( e < 450 ) {
            return [WORK,WORK,CARRY,CARRY,MOVE,MOVE];
        } else if (e <= 550 ) {
            return [WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE];
        } else {
            return common.createBody( [{part:WORK,quantity:10},{part:CARRY,quantity:1},{part:MOVE,quantity:1}], e );
        }
    },

    create_jobs: function( roomName ) {
        // do we have a spawn
        common = require('Common');
        room = Game.rooms[roomName];
        jobs = {};
        if( room == undefined ) {
            return undefined;
        }
        if( room.controller.my ) {
            let job_nm = this.type + ":" + roomName;
            max = common.getWorkforce( roomName, 'upgrader' );

            job = {
                job: job_nm,
                role: this.type,
                min: 1,
                max: max,
                priority: 10,
                options: {
                    controller: room.controller.id,
                    heavyVehicle: true,  //// changes behaviour at fillHerUp()
                    working: false
                },
                bodySmall: [WORK,WORK,CARRY,MOVE],
                body: this.createBody(1100),
                bodyLarge: [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]
            };
            jobs[ job.job ] = job;
        }
        return jobs;
    },

    run: function( creep ) {
        common = require('Common');
        //console.log("Running TopUp");

        if( common.gotoFlag( creep ) < 0 ) {
            return;
        }
        if( common.checkWorking( creep ) == true ) {
            if( creep.room.controller == undefined || creep.room.controller.my==false ) {
                return;
            }

            if( creep.room.controller.id != creep.memory.controller ) {
                let target = Game.getObjectById( creep.memory.controller );
                creep.moveTo( target );
                return;
            }

            if( (e = creep.upgradeController( creep.room.controller )) == ERR_NOT_IN_RANGE ) {
                creep.moveTo( creep.room.controller );
                return;
            }
            if( e == ERR_NOT_OWNER ) {
                console.log( creep.name + " giving up trying to upgrade unowned controller - returning to base");
                creep.memory.targetFlag = 'Flag1';
                return;
            }
            if( creep.store[RESOURCE_ENERGY] <=20 && common.roomInfo[creep.pos.roomName] && common.roomInfo[creep.pos.roomName].upgraderSource ) {
                let uS = Game.getObjectById( common.roomInfo[creep.pos.roomName].upgraderSource )
                if( uS ) {
                    creep.withdraw( uS, RESOURCE_ENERGY )
                }
            }
        } else {
            if( creep.memory.heavyVehicle) {
                common.fillHerUp( creep, undefined, undefined, function(x) {return creep.pos.getRangeTo( x.pos ) < 6})
            } else {
                common.fillHerUp( creep )
            }
            //creep.memory.fedTower = undefined;
        }
    }
};

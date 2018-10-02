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
    min: function() {return 3;},
    max: function() {return 6;},
    max_energy: function() {return  1000;},
    work_sequence: function() {return ['slacker'];},

    createBody: function( e ) {
        common=require('Common');
        if( e < 400 ) {
            return [WORK,WORK,CARRY,MOVE];
        } else {
            return common.createBody( [{part:WORK,quantity:3},{part:CARRY,quantity:2},{part:MOVE,quantity:2}], e );
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
            max = 2;
            if( common.roomInfo[roomName].workforce['upgrader'] != undefined ) {
                max = common.roomInfo[roomName].workforce['upgrader'];
            }
            job = {
                job: job_nm,
                role: this.type,
                min: 1,
                max: max,
                priority: 10,
                options: {
                    controller: room.controller.id,
                    working: false
                },
                body: [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]
            };
            jobs[ job.job ] = job;
        }
        return jobs;
    },

    run: function( creep ) {
        common = require('Common');
        
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
        } else {
            common.fillHerUp( creep );
            creep.memory.fedTower = undefined;
        }
    }
};

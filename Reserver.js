
module.exports = {
    type: 'reserver',
    min: function() {return 0;},
    max: function() {return 0;},
    work_sequence: function() {return ['upgrader'];},
    createBody: function( e, spawn, options ) {
        return [CLAIM,CLAIM,CLAIM,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
    },

    create_jobs: function( roomName, rInfo ) {
      if( rInfo.reserve == true  ) {
        if( Game.rooms[roomName] == undefined ) {
          console.log("Room " + roomName + " has no data for me");
          return {};
        }
        controller = Game.rooms[roomName].controller;
        if( controller == undefined ) {
          console.log( "Reserved room " + roomName + " has no controller to reserve!");
          return {};
        }
        if( controller.reservation == undefined || controller.reservation.ticksToEnd < 1500 ) {
          let rV = {};
          let job = 'reserver:' + roomName;
          rV[ job ] = {
            role: this.type,
            job: job,
            min: 1,
            max: 1,
            priority: 30,
            options: {
              targetFlag: rInfo.flag,
              controller: controller.id
            },
            body: this.createBody()
          };
          return rV;
        }
      }
      return {};
    },


    run: function( creep ) {
        common = require('Common');
        if( Memory.claim == creep.memory.controller ) {
          Memory.claim = undefined;
        }
        if( common.gotoFlag( creep ) < 0 ) {
          return;
        }

        if( creep.memory.controller != undefined ) {
            controller = Game.getObjectById( creep.memory.controller );
            if( (e=creep.reserveController( controller )) == ERR_NOT_IN_RANGE) {
                creep.moveTo( controller );
                return;
            }
            if( e < 0 ) {
                console.log( creep.name + " got error " + e + " trying to reserve controller");
            } else {
                console.log( creep.name + " is reserving the controller!")
            }
        } else {
            console.log( "Reserver " + creep.name + " awaits a claim instruction");
        }
    }



};

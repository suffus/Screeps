/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('RemoteHauler');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    type: 'hauler',
    min: function() {return 0;},
    max: function() {return 0;},

    create_all_jobs: function( ) {
      if( Memory.dockets == undefined || Memory.dockets.length == 0 ) {
        return {};
      }
      let job = {
        'role': 'hauler',
        'job': 'hauling',
        'min': 0,
        'max': 1,
        'priority': 10,
        'body': this.createBody( 1800 ),
        'options': {

        }
      };
      return {'hauling':job};
    },

    run: function( creep ) {
        if( creep.memory.docket == undefined ) {
          let docket = Memory.dockets[0];
          if( docket != undefined ) {
            let thisOrder = {'from': docket.from, 'to': docket.to, 'resources':{}};
            creep.memory.status = 'collecting';
            creep.memory.docket = thisOrder;
            let carryCapacity = _.sum( creep.body, (x) => x.type == CARRY ? 50 : 0);
            console.log("HAULER CC = " + carryCapacity);
            for( res in docket.resources ) {
              if( docket.resources[res] >= carryCapacity ) {
                docket.resources[res] -= carryCapacity;
                thisOrder.resources[res] = carryCapacity;
                carryCapacity = 0;
                break;
              } else {
                if( docket.resources[res] > 0 ) {
                  thisOrder.resources[res] = docket.resources[res];

                  carryCapacity -= thisOrder.resources[res];
                }
                delete docket.resources[res];
              }
            }

            if( _.sum( docket.resources ) == 0 ) {
              Memory.dockets.shift();
            }
          } else {
            creep.memory.status = 'onthebru';
            return;
          }
        }
        if( creep.memory.status == 'collecting' ) {
          let src = Game.getObjectById( creep.memory.docket['from'] );

          if( src != undefined ) {
            if( creep.pos.getRangeTo( src ) > 1 ) {
              creep.moveTo( src );
              return;
            }

            for( let s in src.store ) {
              if( src.store[s] == 0 ) {
                continue;
              }
              let res = creep.memory.docket.resources;
              if( res == undefined || res == s ||
                (typeof( res ) == "object" && res[s] != undefined) ) {
                let err = -100;
                if( (err = creep.withdraw( src, s )) == OK ) {
                  return;
                }
                console.log( "Hauler attempting to withdraw " + s + " from " + src + " received " + err);
                if( err != ERR_FULL ) {
                  return;
                }
              }
            }
            creep.memory.status = "delivering";
          }
        }
        if( creep.memory.status == 'delivering' ) {
          if( _.sum( creep.carry ) == 0 ) {
            creep.memory.status = "onthebru";
            creep.memory.docket = undefined;
            return;
          }
          let src = Game.getObjectById( creep.memory.docket['to'] );
          if( src != undefined ) {
            if( creep.pos.getRangeTo( src ) > 1 ) {
              creep.moveTo( src );
              return;
            }
            for( let s in creep.carry ) {
              let err = creep.transfer( src, s );
              if( err == ERR_FULL ) {
                console.log( 'Hauler trying to transer into full vessel');
                return err;
              }
            }
          }
        }
    },

    createBody: function( energy ) {
        return require('Common').createBody( [{'part':CARRY,'quantity':2},{'part':MOVE,'quantity':1}], energy );
    }
};

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
          creep.memory.docket = Memory.dockets.shift();
          if( creep.memory.docket != undefined ) {
            creep.memory.status = 'collecting';
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
              if( creep.memory.docket.resources == undefined || creep.memory.docket.resources[s] != undefined ) {
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

/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Claimer');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    type: 'claimer',
    min: function() {return 0;},
    max: function() {return 0;},
    work_sequence: function() {return ['upgrader'];},
    createBody: function( e, spawn, options ) {
        return [CLAIM,MOVE,MOVE,MOVE,MOVE];
    },
    createCreep: function( energy, spawn, options ) {
        body = createBody( energy );
        claim = undefined;
        if( options != undefined && options.claim != undefined ) {
            claim = options.claim;
        }
        return spawn.createCreep( body, undefined, {role:'claimer', working:true, claim: claim} );
    },

    create_all_jobs: function() {
      if( Memory.claim != undefined ) {
        return {
            'claimer': {
              min:1,
              max:1,
              job: 'claimer',
              role:'claimer',
              priority: 5,
              options: {
                working: true,
                controller: Memory.claim
              },
              body: this.createBody()
            }
        };
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
            if( (e=creep.claimController( controller )) == ERR_NOT_IN_RANGE) {
                creep.moveTo( controller );
                return;
            }
            if( e < 0 ) {
                console.log( creep.name + " got error " + e + " trying to claim controller");
            } else {
                console.log( creep.name + " has claimed controller!")
            }
        } else {
            console.log( "Claimer " + creep.name + " awaits a claim instruction");
        }
    }



};

/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Claimer');
 * mod.thing == 'a thing'; // true
 */
const common = require('Common')
module.exports = {
    type: 'claimer',
    min: function() {return 0;},
    max: function() {return 1;},
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
        let jobs = {};
      if( Memory.claim ) {
        jobs['claimer'] = {
              min:1,
              max:1,
              job: 'claimer',
              role:'claimer',
              priority: 5,
              options: {
                working: true,
                task: 'claimer',
                room: Memory.claim
              },
              body: this.createBody()
            };
        }

        for( let rm in common.roomInfo ) {
            if( common.getWorkforce( rm, 'reserver') > 0 ) {
                jobs['reserver:'+rm]= {
                    min:1,
                    max:1,
                    job: 'reserver:'+rm,
                    role: 'claimer',
                    priority:10,
                    options: {
                        working: true,
                        task: 'reserver',
                        room: rm
                    },
                    body: this.createBody()
                }
            }
        }

        return jobs;
    },

    run: function( creep ) {
        if( !creep.memory.room ) {
          console.log("***** MALFORMED CLAIMER COMMITTING SUICIDE *****")
          creep.suicide()
        }
        if( creep.memory.room !== undefined && creep.memory.room !== creep.pos.roomName) {
          creep.memory.targetFlag = common.getFlag( creep.memory.room );
        }
        if( common.gotoFlag( creep ) < 0 ) {
          return ERR_NOT_IN_RANGE
        }
        if( creep.memory.controller === undefined ) {
            let cS = Game.rooms[creep.memory.room].find( FIND_STRUCTURES, (x) => x.structureType === STRUCTURE_CONTROLLER );
            if( cS.length > 0 ) {
                creep.memory.controller = cS[0].id
            } else {
                console.log("***** Claimer "+creep.name+" cannot locate a controller in "+creep.pos.roomName)
                return ERR_NOT_FOUND
            }
        }
        if( creep.memory.controller != undefined ) {
             controller = Game.getObjectById( creep.memory.controller );
             if( creep.memory.task === "reserver") {
                 if((e = creep.reserveController( controller )) == ERR_NOT_IN_RANGE) {
                    creep.moveTo( controller )
                    return e
                 }
            } else if( (e=creep.claimController( controller )) == ERR_NOT_IN_RANGE) {
                creep.moveTo( controller );
                return e
            }
            if( e < 0 ) {
                console.log( creep.name + " got error " + e + " trying to claim controller");
            } else {
                console.log( creep.name + " has claimed controller!")
            }
            return e
        } else {
            console.log( "Claimer " + creep.name + " awaits a claim instruction");
            return ERR_NOT_FOUND
        }
    }



};

/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('EnergyTrain');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    routes: {
        'ExtensionStoker' : {
            min:1,
            max:1,
            route_type: 'line',
            route: [
                {structure:'5ee5e89572b57d36b39425c6', action:'deposit', skipIfEmpty: true}, /// store
                {structure: '5ee10f883a9bf92e533fd2e2', action:'withdraw'}
            ],
            body: [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE]
        },
        'SpawnSupply' : {
            min:1,
            max:1,
            route_type: 'circle',
            body:[CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE],
            route:[
                {structure: '5ee11f223659f6084f3bab7b', action:'withdraw', skipIfEmpty: true, skipIfFull: true},
                {structure:'5ee5e89572b57d36b39425c6', action:'withdraw', skipIfEmpty: true, skipIfFull: true}, /// store
                {structure: '5ee6d5a972b57d67f2949fc3', action:'drain'}
            ]
        },
        'ThomasLinker': {
          min:1,
          max:1,
          route_type: 'line',
          body:[MOVE,CARRY,CARRY],
          route:[
              {structure:'5ee5e89572b57d36b39425c6', action:'withdraw'},
              {structure:'5ee836388e5ccb95635224fa', action:'drain'}
              ]
        },
        'SlimJim': {
            min: 1,
            max: 1,
            route_type: 'line',
            body: [MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,CARRY,CARRY,MOVE],

          route: [{structure:'5ee5e89572b57d36b39425c6',action:'deposit'},
          {structure:'5ee4531940a8aa0b6f531321', action:'withdraw'}
          ]
        },
        'FatMax': {
            min: 1,
            max: 5,
            route_type: 'line',
            body: [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE],
            route:[
                {structure:'5ee5e89572b57d36b39425c6',action:'deposit'},
                {structure: 'Flag3', action: 'flag'},
                {structure:'572f11329335d17d5c820e66',action:'withdraw'}
                ]
        }
    },
    type: 'energyTrain',
    max: function() {return 2},
    min: function() {return 1},
    min_energy: function() {
        return 1000;
    },
    max_energy: function() {
        return 1000;
    },
    createBody: function( eA ) {
        common=require('Common')
        return common.createBody( [{part:CARRY,quantity:10},{part:MOVE,quantity:6}], eA);
    },
    create_all_jobs: function( ) {
      let rV = {};
      for( route in this.routes ) {
        spec = this.routes[ route ];
        if( typeof( spec ) == "object" ) {
            let count_min = spec['min'] || 1;
            let count_max = spec['max'] || 1;
            let energy = this.max_energy();
            if( spec.size > 0 ) {
              energy = spec.size;
            }
            let body = spec.body || this.createBody( energy );
            let priority = spec['priority'] || 50;
            let job = 'energyTrain:' + route;
            rV[job] = {
              role: this.type,
              job: job,
              min: count_min,
              max: count_max,
              priority: priority,
              body: body,
              options: {
                route: route
              }
            };
            if( spec.spawns != undefined ) {
              rV[job].spawns = spec.spawns;
            }
        } else {
            console.log( 'Cannot create EnergyTrain for ' + roomName );
        }
      }
      return rV;
    },

    getTargetObject: function( sS ) {
        let rV = Game.getObjectById( sS ) || Game.flags[sS] || null
        return rV
    },
    run: function ( creep ) {
        if( creep.memory.nextStation == undefined ) {
            creep.memory.nextStation = 0;
            creep.memory.direction = 1;
        }

        if( creep.carry.energy == creep.carryCapacity && creep.memory.nextStation > 4 && creep.memory.direction == 1 ) {
            creep.memory.direction = -1;
            this.goNextStation( creep );

        }
        var route = this.route;
        if( creep.memory.route != undefined ) {
          if( this.routes[creep.memory.route] == undefined ) {
            route = this.route;
          } else {
            route = this.routes[ creep.memory.route ].route;
          }
        }
        // First find nearby tombstones etc
        source_dropped = creep.pos.findClosestByPath( FIND_DROPPED_RESOURCES, {
            filter: (r) => r.resourceType == RESOURCE_ENERGY && creep.pos.getRangeTo( r ) <= 5
        } );
        source_tombstone = creep.pos.findClosestByPath( FIND_TOMBSTONES, {
            filter: (x) => x.store[RESOURCE_ENERGY] > 0 && creep.pos.getRangeTo( x ) <= 5
        } );

        if( source_dropped != undefined && creep.carry.energy < creep.carryCapacity ) {
            if( creep.pickup( source_dropped ) == ERR_NOT_IN_RANGE ) {
                creep.moveTo( source_dropped );
            }
            return;
        }
        if( source_tombstone != undefined && creep.carry.energy < creep.carryCapacity ) {
            if( creep.withdraw( source_tombstone, RESOURCE_ENERGY ) == ERR_NOT_IN_RANGE ){
                creep.moveTo( source_tombstone );
            }
            return;
        }
        if( route[creep.memory.nextStation] == undefined ) {
            this.goNextStation( creep );
            return;
        }
        structure = route[creep.memory.nextStation].structure;
        let structures = []
        if( structure !== undefined && structure.constructor == Array ) {
            structures = _.filter(_.map( structure, (x) => this.getTargetObject(structure) ), (z) => z != undefined );
            if( structures.length == 0  ) {
                this.goNextStation( creep );
                return;
            }
            minE = structures[0].energy;
            structure = structures[0];
            for( s of structures) {
                if( s.energy < minE ) {
                    minE = s.energy;
                    structure = s;
                }
            }
            structures = [structure];
        } else {
            structures = [this.getTargetObject(structure)];
            if( structures[0] === null ) {
                this.goNextStation( creep )
                return
            }
        }
        action = route[creep.memory.nextStation].action;
        for( structure of structures ) {
            if( creep.pos.getRangeTo( structure ) > 1) {
                creep.moveTo( structure );
                return;
            }
            if( structure.structureType != undefined ) {
                sT = structure.structureType;
            }
            err = -1;
            if( action == 'deposit' && creep.carry.energy > 0 ) {
                if( sT == STRUCTURE_CONTAINER || sT == STRUCTURE_STORAGE || sT == STRUCTURE_LINK || sT == STRUCTURE_TOWER) {
                    err = creep.transfer( structure, RESOURCE_ENERGY );
                }
            } else if( action == 'withdraw' && structure != undefined && ( (structure.store != undefined && structure.store[RESOURCE_ENERGY] > 0) || structure.energy > 0 )) {
                if( sT = STRUCTURE_CONTAINER  || sT == STRUCTURE_STORAGE || sT == STRUCTURE_LINK ) {
                    err = creep.withdraw( structure, RESOURCE_ENERGY );
                }  else if( 0 ) {
                    err = creep.pickup( structure, RESOURCE_ENERGY );
                } else {
                    console.log("***ERRRR NO SOURCE!");
                    err = -1;
                }
            } else if( action == 'drain' && creep.carry.energy > 0 ) {
                err = creep.transfer( structure, RESOURCE_ENERGY );
            }
        }
        if( action == 'drain' && creep.carry.energy > 100 ) {
            err = ERR_BUSY;
        }
        console.log( creep.name + " (train) received " + err + " trying to " + action + " from/to " + structure)
        if( err == -1 ) {
            console.log("Train could not implement action - going to next station")
            err = 0;
        }
        if( err == -8 && (action == 'deposit' || action == 'withdraw')) {
            console.log( "Energy Train tried to transfer but the target was full" )
            err = 0;
        }

        if( err != ERR_BUSY ) {
            console.log("Going To Next Station")
            this.goNextStation( creep );
        } else {
            console.log( "EnergyTrain got " + err + " trying to " + action + " from/to " + structure )
        }

    },

    goNextStation: function( creep ) {
        var route = this.routes[creep.memory.route].route;
        let rType = this.routes[creep.memory.route].route_type;

        if( rType == 'line') {
          let n = route.length + 1;
          while( n > 0 ) {
              if( creep.memory.nextStation >= route.length - 1 && creep.memory.direction == 1 ) {
                  creep.memory.nextStation = route.length - 1;
                  creep.memory.direction = -1;
              } else if( creep.memory.nextStation == 0 && creep.memory.direction == -1 ) {
                creep.memory.direction = 1;
              }
              creep.memory.nextStation += creep.memory.direction;
              s = route[creep.memory.nextStation].structure;
              if( s !== undefined && this.isStructureOK( s, creep ) ) {
                break;
              }
              n = n - 1;
            }
        } else if( rType == 'circle' ) {
          let n = route.length + 1;
          while( n > 0 ) {
            creep.memory.nextStation += creep.memory.direction;
            if( creep.memory.nextStation < 0 ) {
              creep.memory.nextStation = route.length - 1;
            } else if( creep.memory.nextStation >= route.length ) {
              creep.memory.nextStation = 0;
            }
            let s = route[creep.memory.nextStation];
            if( this.isStructureOK( s, creep ) ) {
              break;
            }
            n = n - 1;
          }
        } else {
          console.log( "Unidentified route type " + rType + " for energyTrain");
        }
    },

    isStructureOK: function( struct, creep ) {
      if( Array.isArray( struct )) {
        for( let a of struct ) {
          if( this.getTargetObject( a ) !== null ) {
            return true;
          }
        }
      } else {
        if( this.getTargetObject( struct ) !== null ) {
            if( struct.skipIfEmpty ) {
                if( this.getTargetObject.store[RESOURCE_ENERGY] === 0 ) {
                    return false;
                }
            }
            console.log("Check Skip Full "+creep.memory.route)
            if( struct.skipIfFull ) {
                console.log( "Asked to skip if full")
                if( creep.store.getFreeCapacity( RESOURCE_ENERGY ) === 0  ) {
                    return false
                }
            }
            return true;
        }
      }
      return false;
    }
};

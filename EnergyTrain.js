/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('EnergyTrain');
 * mod.thing == 'a thing'; // true
 */

module.exports = {

    route: [
      {structure:['5b9964c1c84f904d3ccaf2dc','5b9e98683b50fb23e20a6407'],action:'drain'}, // LINKS W13S12
      {structure:'5ba21d0f678e5b460f94737b',action:'withdraw'}, // LINK W12S12
      {structure:'5b97ea084fe61b156b29b1d6',action:'deposit'}, // TOWER
      {structure:'5b994a6326ecb104baa0fdb6',action:'deposit'}, // CONTAINER
      {structure:'5ba1ec7126ecb104baa451e0',action:'withdraw'}, // CONTAINER W12S13
      {structure:'5ba7c1a6d102a632169bd815', action:'withdraw'}, // CONTAINER W11S13
      {structure:'5ba29ff651fc9162c67ebb27',action:'withdraw'} // CONTAINER W11S13
    ],

    routes: {
        'waywardChugger': {
          route: [{structure:'5bb4baf638edad1d8aaa0628', action:'withdraw'},
                {structure:'5b97c58e57ff3a6290eb0701', action:'deposit'}],
          min: 1,
          max: 1,
          priority: 50,
          capacity: 1000
        },
        'barracksPuffer': { route:[
                    {structure:['5b9964c1c84f904d3ccaf2dc','5b9e98683b50fb23e20a6407'],action:'drain'}, // LINKS W13S12
                    {structure:'5ba21d0f678e5b460f94737b',action:'withdraw'}, // LINK W12S12
                    {structure:'5b97ea084fe61b156b29b1d6',action:'deposit'}, // TOWER
                    {structure:'5b994a6326ecb104baa0fdb6',action:'deposit'}, // CONTAINER
                    {structure:'5ba1ec7126ecb104baa451e0',action:'withdraw'}, // CONTAINER W12S13
                    {structure:'5ba7c1a6d102a632169bd815', action:'withdraw'}, // CONTAINER W11S13
                    {structure:'5ba29ff651fc9162c67ebb27',action:'withdraw'} // CONTAINER W11S13
                  ],
                  min: 3,
                  max: 4,
                  priority: 55,
                  capacity: 1000
        }
    },
    type: 'energyTrain',
    max: function() {return 4},
    min: function() {return 4},
    min_energy: function() {
        return 1600;
    },
    max_energy: function() {
        return 1600;
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
            let body = this.createBody( this.max_energy() );
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
        } else {
            console.log( 'Cannot create EnergyTrain for ' + roomName );
        }
      }
      return rV;
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
        if( structure.constructor == Array ) {
            structures = _.filter(_.map( structure, (x) => Game.getObjectById(x) ), (z) => z != undefined );
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
            structures = [Game.getObjectById(structure)];
            if( structures[0] == undefined ) {
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
            this.goNextStation( creep );
        } else {
            console.log( "EnergyTrain got " + err + " trying to " + action + " from/to " + structure )
        }

    },

    goNextStation: function( creep ) {
        if( creep.memory.route == undefined || creep.memory.route == 'easternExpress') {
          creep.memory.route = 'barracksPuffer';
        }
        var route = this.routes[creep.memory.route].route;

        while( 1 ) {
            if( creep.memory.nextStation >= route.length - 1 && creep.memory.direction == 1 ) {
                creep.memory.nextStation = route.length - 1;
                creep.memory.direction = -1;
            } else if( creep.memory.nextStation == 0 && creep.memory.direction == -1 ) {
                creep.memory.direction = 1;
            }
            creep.memory.nextStation += creep.memory.direction;
            s = route[creep.memory.nextStation].structure;
            if( Array.isArray(s) ) {
                break;
            } else if( Game.getObjectById( s ) == undefined) {
                console.log( "!!!!!******!!!!! Train " + creep.name + " could not find source " + s)
                continue;
            } else {
                break;
            }
        }
    }

};

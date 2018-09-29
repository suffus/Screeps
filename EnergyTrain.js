/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('EnergyTrain');
 * mod.thing == 'a thing'; // true
 */

module.exports = {

    route: [{structure:['5b9964c1c84f904d3ccaf2dc','5b9e98683b50fb23e20a6407'],action:'drain'},{structure:'5ba21d0f678e5b460f94737b',action:'withdraw'},
            {structure:'5b9b76aef2b3a923f3745fd5',action:'withdraw'},{structure:['5b9964c1c84f904d3ccaf2dc','5b9e98683b50fb23e20a6407'],action:'drain'},
            //{structure:'5ba7a7848a5aa7753406ebaf', action:'withdraw'},
            {structure:'5b97ea084fe61b156b29b1d6',action:'deposit'},
    {structure:'5b994a6326ecb104baa0fdb6',action:'deposit'},{structure:'5ba1ec7126ecb104baa451e0',action:'withdraw'},
    {structure:'5ba356f5df27935437f0a421',action:'withdraw'},
    {structure:'5ba7c1a6d102a632169bd815', action:'withdraw'},
    {structure:'5ba29ff651fc9162c67ebb27',action:'withdraw'}],

    routes: {
        tankEngine: [{structure:['5b9964c1c84f904d3ccaf2dc','5b9e98683b50fb23e20a6407'],action:'drain'},{structure:'5ba21d0f678e5b460f94737b',action:'withdraw'},
            {structure:'5b9b76aef2b3a923f3745fd5',action:'withdraw'},{structure:['5b9964c1c84f904d3ccaf2dc','5b9e98683b50fb23e20a6407'],action:'drain'},
            {structure:'5ba21d0f678e5b460f94737b',action:'withdraw'},
            {structure:'5b9b76aef2b3a923f3745fd5',action:'withdraw'},{structure:'5b97ea084fe61b156b29b1d6',action:'deposit'}],
        spawnSupply: [{structure:['5b9964c1c84f904d3ccaf2dc','5b9e98683b50fb23e20a6407'],action:'drain'},{structure:'5b9b76aef2b3a923f3745fd5',action:'withdraw'},
                        {structure:'5ba21d0f678e5b460f94737b',action:'withdraw'}],
        linkSupply: [{structure:'5ba22049cb444c51a999611b',action:'drain'},{structure:'5ba1ec7126ecb104baa451e0',action:'withdraw'},
                        {structure:'5b9e43b104313b172fff9ac7',action:'withdraw'},{structure:'5ba29ff651fc9162c67ebb27',action:'withdraw'}]
    },
    type: 'energyTrain',
    max: function() {return 4},
    min: function() {return 3},

    selectRoute: function( creep ) {
        if( creep.memory.service == undefined ) {
            trains = _.filter( Game.creeps, (x) => x.memory.role == 'energyTrain' );
            num_trains = []
            for( let t of trains ) {
                if( t.memory.service != undefined ){
                    num_trains[ t.memory.service ]++;
                }
            }

        }
    },

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
    run: function ( creep ) {

        if( creep.memory.nextStation == undefined ) {
            creep.memory.nextStation = 0;
            creep.memory.direction = 1;
        }

        if( creep.carry.energy == creep.carryCapacity && creep.memory.nextStation > 4 && creep.memory.direction == 1 ) {
            creep.memory.direction = -1;
            this.goNextStation( creep );
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
        if( this.route[creep.memory.nextStation] == undefined ) {
            this.goNextStation( creep );
            return;
        }
        structure = this.route[creep.memory.nextStation].structure;
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
        action = this.route[creep.memory.nextStation].action;
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
        var route = this.route;
        if( creep.memory.route != undefined ) {
            route = this.routes[creep.memory.route];
        }
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

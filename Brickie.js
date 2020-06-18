/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Brickie');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    type: 'brickie',
    min: function() {return 0;},
    max: function() {return 2;},
    work_sequence: function() {return ['upgrader'];},


    run: function( creep ) {
        common = require('Common');
        roleBuilder = require('Builder');
       if( common.gotoFlag( creep ) < 0 ) {
            return;
        }
        if( common.checkWorking( creep ) ) {
            var sites = _.filter( Game.constructionSites, (x) => x.structureType == STRUCTURE_RAMPART || x.structureType == STRUCTURE_WALL );
            if( sites.length > 0 ) {
                if( creep.build( sites[0] ) == ERR_NOT_IN_RANGE ) {
                    creep.moveTo( sites[0] );
                    return;
                }
            }

            var walls = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART
                });

            var min = 300000000;
            var target = undefined;
            if( creep.memory.targetBricks != undefined ) {
                walls = _.filter(_.map(creep.memory.targetBricks, (x) => Game.getObjectById(x)), (y) => y != undefined );
            }

            for( let w of walls ) {
                if( w.hits < min ) {
                    min = w.hits;
                    target = w;
                }
            }

            if( target != undefined ) {
                console.log('Brickie ' + creep.name + ' going to brick '+target.pos)
                if( (e = creep.repair( target)) == ERR_NOT_IN_RANGE ) {
                    creep.moveTo( target );
                }
                if( e == OK && creep.memory.targetBrick != undefined) {
                    if( creep.memory.counter++ < 10 ) {

                    }
                }
            } else {
                console.log('No target for ' + creep.name)
                return roleBuilder.run( creep );
            }
        } else {
            common.fillHerUp( creep );
        }

    }

};

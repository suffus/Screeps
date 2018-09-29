/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Healer');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    type: 'healer',
    min: function() {
            return 0;
    },
    max: function() {
        return 0;
    },
    
    createBody: function( e ) {
        bT = [{part:TOUGH,quantity:2},{part:MOVE,quantity:3},{part:HEAL,quantity:1}];
        return require('Common').createBody( bT, e );
    },
    run: function( creep ) {
        my_damaged_creeps = _.filter( Game.creeps, (x) => _.sum( _.map( x.body, (z) => 100-z.hits)) > 0  );
        
        dcp = creep.pos.findClosestByRange( my_damaged_creeps ); // may be me
        if( dcp == undefined ) {
            console.log('Healer cannot find anyone to heal' + my_damaged_creeps)
            if( creep.memory.leader != undefined ) {
                creep.moveTo( creep.memory.leader );
                return;
            }
        }
        if( creep.heal( dcp ) == ERR_NOT_IN_RANGE ) {
            console.log('Healer '+creep.name+' is moving to '+dcp)
            creep.moveTo( dcp );
        }
        
        

        if( creep.memory.rampart != undefined ) {
            rampart = Game.getObjectById( creep.memory.rampart );
            if( creep.moveTo( rampart ) == 0 ) {
            
            }
            console.log( creep.name + ' moving to rampart ' + creep.memory.rampart);
            return;
        }
        
        if( dcp == undefined ) {
            if( creep.memory.station == undefined ) {
                creep.memory.station = 'Flag5';
            } 
            flag = Game.flags[creep.memory.station];
            creep.moveTo( flag );
            //creep.moveTo( Game.getObjectById('5b8a1c05b2fa0416d2428450'));
            //creep.attack( Game.getObjectById( '5b8a1c05b2fa0416d2428450'));
        
        
        }
    }

};
/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Builder');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    type: 'builder',
    min: function() {return 0;},
    max: function() {reqE = _.sum( Game.constructionSites, (x) => x.progressTotal - x.progress ); nB = Math.ceil( reqE/50000 ); if( nB > 4 ) {return 4;} else {return (nB == 0 ? (reqE > 0 ? 1 : 0) : nB) }},
    max_energy: function() {return 1200;},
    work_sequence: function() {return ['upgrader'];},

   run: function( creep ) {
       repairer = require('Repairer');
       upgrader = require('TopUp');
       brickie = require('Brickie');
       common = require('Common');
       
       if( common.gotoFlag( creep ) < 0 ) {
            return;
        }  
        if( common.checkWorking(creep ) == true ) {
            
            var cS = _.map(Game.constructionSites, (x,y) => x);
            //console.log( "LCS="+ cS );
            var constructionSite = creep.pos.findClosestByPath( cS ); //, {
            //    filter: (x) => creep.memory.room != undefined ? x.pos.roomName == creep.memory.room : true
            //});
            // if one is found
            
            if( constructionSite == undefined && cS.length > 0 ) {
                constructionSite = cS[0];
            }
            
            if (constructionSite != undefined) {
                console.log( creep.name + " going to construct " + constructionSite)
                // try to build, if the constructionSite is not in range
                if ((rv = creep.build(constructionSite)) == ERR_NOT_IN_RANGE) {
                    // move towards the constructionSite
                    creep.moveTo(constructionSite);
                } else {
                    console.log(creep.name + " received rval = " + rv);
                }
                return OK;
            } else {
                console.log( creep.name + ' has no construction sites' + _.map(Game.constructionSites, (x) => x.pos.roomName).join(","))
                return repairer.run( creep ); /// should be decision of master controller
            }
        } else {
            
                common.fillHerUp( creep );
                return ERR_NOT_ENOUGH_ENERGY;

        }
    }
};
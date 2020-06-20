/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Builder');
 * mod.thing == 'a thing'; // true
 */

const common = require('Common')
const repairer = require('Repairer')

module.exports = {
    type: 'builder',
    min: function() {return 1;},
    max: function() {
      let reqE = _.sum( Game.constructionSites, (x) => (x.progressTotal - x.progress) );
      let nB = Math.ceil( reqE/3000 );
      if( nB > 3 ) {
        return 3;
      } else {
        return (nB == 0 ? (reqE > 0 ? 1 : 0) : nB)
      }
    },
    max_energy: function() {return 1200;},
    createBody: function( eE ) {
        if( eE < 500 ) {
            return [WORK,WORK,CARRY,MOVE]
        }
        if( eE <= 800 ) {
            return [WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE]
        }
        return [WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE]
    },

   run: function( creep, shouldNotRepair ) {

       if( common.gotoFlag( creep ) < 0 ) {
            return;
        }


        if( common.checkWorking( creep ) == true ) {
            //console.log("Builder Working")
            let constructionSite;
            if( (creep.memory.current_site == undefined) ||
                (constructionSite = Game.getObjectById( creep.memory.current_site )) == undefined ||
                ((Game.time % 7) == 6) ) {
                    common.clearParking( creep )
                  let cS = _.map(Game.constructionSites, (x,y) => x);
                  let constructionSite = creep.pos.findClosestByPath( cS );

                  if( constructionSite == undefined && cS.length > 0 ) {
                      constructionSite = cS[0];
                  }
                  if( constructionSite != undefined ) {
                    creep.memory.current_site = constructionSite.id;
                  } else {
                    creep.memory.current_site = undefined;
                  }
            }
            if (constructionSite != undefined) {
                //console.log( creep.name + " going to construct " + constructionSite)
                // try to build, if the constructionSite is not in range
                if ((rv = creep.build(constructionSite)) == ERR_NOT_IN_RANGE || common.isBlockingSource( creep )) {
                    creep.moveTo(constructionSite);
                } else {
                    console.log(creep.name + " received rval = " + rv + " while trying to build " + constructionSite );
                    common.getOutOfTheWay( creep, constructionSite )
                }
                return OK;
            } else {
                console.log( creep.name + ' has no construction sites' + _.map(Game.constructionSites, (x) => x.pos.roomName).join(","))
                if( !shouldNotRepair ) {
                    return repairer.run( creep, true ); /// should be decision of master controller
                }
            }
        } else {
            common.fillHerUp( creep );
            return ERR_NOT_ENOUGH_ENERGY;
        }
    }
};

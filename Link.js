/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Link');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    name: 'Link',

    runRoom: function( room, roomInfo ) {
        if( roomInfo.links == undefined ) {
            return ERR_NOT_FOUND;
        }
        for( let lnk_id of roomInfo.links.from) {
            link = Game.getObjectById( lnk_id )
            if( link != undefined && link.energy > (link.energyCapacity - 100) ) {
                let linkToRef = roomInfo.links.to;
                if( Array.isArray( linkToRef ) ) {
                    let links = _.filter(_.map( linkToRef, (x) => Game.getObjectById( x )), (x) => x.energy < 100 );
                    if( links.length == 0 ) {
                      return ERR_FULL;
                    }
                    linkToRef = links[ Game.time % links.length ].id;
                }
                linkTo = Game.getObjectById( linkToRef );
                if(link.energy >= (link.energyCapacity - 100) && linkTo.energy < 100 &&  (e=link.transferEnergy( linkTo ))<0) {
                    console.log("Link transfer returned "+e);
                    return e;
                }
            }
        }
        return OK;
    }
};

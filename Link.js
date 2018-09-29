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
    
    runRoom: function( room ) {
        common = require('Common');
        if( common.roomInfo[room].links == undefined ) {
            return ERR_NOT_FOUND;
        }
        for( lnk of common.roomInfo[room].links.from) {
            link = Game.getObjectById( lnk )
            if( link != undefined && link.energy > 0 ) {
                linkTo = Game.getObjectById( common.roomInfo[room].links.to );
                if(link.energy >= (link.energyCapacity - 100) && linkTo.energy < 100 &&  (e=link.transferEnergy( linkTo ))<0) {
                    console.log("Link transfer returned "+e);
                }
            }
        }
    }
};
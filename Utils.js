
module.exports = {
  haul: function( r1, s1, r2, s2, stuff ) {
    roomInfo = require('Common').roomInfo ;
    let job = {};
    job['from'] = roomInfo[r1].map[s1];
    job['to'] = roomInfo[r2].map[s2];

    if( stuff != undefined ) {
      job[resources] = stuff;
    }
    Memory.dockets.push( job );
  }
}


module.exports = {
  haul: function( r1, s1, r2, s2, stuff, amount ) {
    roomInfo = require('Common').roomInfo ;
    let job = {};
    job['from'] = roomInfo[r1].map[s1];
    job['to'] = roomInfo[r2].map[s2];

    if( stuff != undefined ) {
      sObject = {};
      job['resources'] = sObject;
      if( amount == undefined ) {
        amount = 1000;
      }
      sObject[stuff] = amount;
    } else {
      let src = Game.getObjectById( job['from']);
      if( src.store != undefined ) {
        let set = {};
        for( res in src.store ) {
          set[res] = src.store[res];
        }
        job['resources'] = set;
      }
    }
    Memory.dockets.push( job );
  },
  getRoomInfo: function( roomName ) {
      const raw = (new Room.Terrain( roomName )).getRawBuffer()
      //console.log(JSON.stringify(raw))
      const look = (new Room(roomName)).lookForAtArea(LOOK_STRUCTURES,0,0,50,50);
      console.log( JSON.stringify( look ) )
      Memory.lastRoomInfo = look
  }

}

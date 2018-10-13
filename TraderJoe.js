


module.exports = {
    type: 'trader',

    pushTrade: function( resType, room, maxAmount, type, maxCPM ) {
      let trade = {
        'resourceType': resType,
        'roomName': room,
        'amount': maxAmount,
        'tradeType': type,
        'maxCPM': maxCPM
      };
      if( Memory.trades == undefined ) {
        Memory.trades = [];
      }
      Memory.trades.push( trade );
    }

};

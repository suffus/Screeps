


module.exports = {
    type: 'trader',

    doTrade: function( ) {
      if( Memory.trades == undefined ) {
        return ERR_NOT_FOUND;
      }
      let orders = Game.market.getAllOrders();
      for( trade of Memory.trades ) {
        if( trade.tradeType == ORDER_SELL )
        let validOrders = _.filter( orders, (x) => x.resourceType == trade.resourceType && x.type == ORDER_BUY
                         && Game.market.calcTransactionCost( 1000, x.roomName, trade.roomName ) <= trade.maxCPM );

        console.log( "There are " + validOrders.length + " valid orders");
      }

    },

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

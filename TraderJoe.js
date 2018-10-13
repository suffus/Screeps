


module.exports = {
    type: 'trader',


    doTrade: function( forReal ) {
              if( Memory.trades == undefined ) {
                return ERR_NOT_FOUND;
              }

              let orders = Game.market.getAllOrders();
              for( trade of Memory.trades ) {

                let  amount = trade.amount;
                if( trade.tradeType == ORDER_SELL ) {
                  let validOrders = _.filter( orders, (x) => x.resourceType == trade.resourceType && x.type == ORDER_BUY
                                 && Game.market.calcTransactionCost( 1000, x.roomName, trade.roomName ) <= trade.maxCPM );

                  console.log( "There are " + validOrders.length + " valid orders");
                  for( v of validOrders ) {
                    console.log( v.id + " " + v.price + " " + v.roomName + " " + v.remainingAmount + " " + Game.market.calcTransactionCost( 1000, v.roomName, trade.roomName))
                    if( forReal ) {
                      let tAmount = amount;
                      if( v.remainingAmount < tAmount ) {
                        tAmount = v.remainingAmount;
                      }

                      let err = Game.market.deal( v.id, tAmount, trade.roomName );
                      console.log("Attempted Trade returned " + err );
                      if( err == 0 ) {
                        amount -= tAmount;
                        if( amount == 0 ) {
                          Memory.trades.shift();
                        } else {
                          trade.amount = amount;
                        }
                      }
                    }
                  }
                }
              }
              return OK;

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

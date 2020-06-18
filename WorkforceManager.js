/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('WorkforceManager');
 * mod.thing == 'a thing'; // true
 */
const common = require('Common')

module.exports = {


    create_emergency_plan() {
        //// this is the case that all harvesters
    },

    create_plan: function( controllers ) {
        thePlan = {};
        defaultPriority = 30;
        for( c_name in  controllers ) {
            let c = controllers[ c_name ];
            if( c.create_jobs != undefined ) {
              for( r in common.roomInfo ) {
                  rJobs = c.create_jobs( r, common.roomInfo[r] );
                  for( j in rJobs ) {
                      thePlan[j] = rJobs[j];
                  }
              }
            } else if( c.create_all_jobs != undefined ) {
              rJobs = c.create_all_jobs();
              for( j in rJobs ) {
                thePlan[j] = rJobs[j];
              }
            } else {
                eA = 500;
                min = 0;
                max = 1;
                priority = 10;
                if( c.max_energy != undefined && eA > c.max_energy() ) {
                    eA = c.max_energy();
                }
                if( c.min != undefined ) {
                    min = c.min();
                }
                if( c.max != undefined ) {
                    console.log('Trying max for ' + c.type)
                    max = c.max();
                }
                body = [];

                if( c.createBody != undefined ) {
                    body = c.createBody( eA );
                } else {
                    body = common.createWorkerBody( eA );
                }
                if( max > 0 ) {
                    jobSpec = {
                        role: c.type,
                        job: c.type,
                        min: min,
                        max: max,
                        body: body,
                        priority: defaultPriority,
                        options: {working: false}
                    };
                    thePlan[ c.type ] = jobSpec;
                }
            }
            defaultPriority--;
        }
        return thePlan;
    }

};

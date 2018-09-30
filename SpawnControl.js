/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('SpawnControl');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    zombieTime: 150,
    schedulePlan: function( plan ) {
        if( Memory.creep_sched == undefined ) {
            Memory.creep_sched = [];
            Memory.sched_ctr = 1;
        }
        liveCreeps = _.filter(Game.creeps, (x) => true ); /// convert to array

        creeps_by_job = {};
        for( let j in plan ) {
            creeps_by_job[ j ] = 0;
        }

        for( let c of liveCreeps ) {
            if( c.ticksToLive > this.zombieTime ) {
                job = c.memory.job;
                if( job == undefined ) {
                    job = c.memory.role;
                }
                if( creeps_by_job[job] == undefined ) {
                    creeps_by_job[job] = 0;
                }
                creeps_by_job[ job ]++;
            }
        }

        let sched_by_job = {};
        _.map( plan, (x,y) => sched_by_job[y] = 0);
        _.map( Memory.creep_sched, (x) => sched_by_job[x.job] = 0);
        _.map( Memory.creep_sched, (x) => sched_by_job[x.job]++ );

        for( let creepJob in plan ) {
            let s = plan[creepJob];
            let s_min = s.min > 0 ? s.min : 1;
            let s_max = s.max > 0 ? s.max : 1;
            let s_job = s.job != undefined ? s.job : s.role;
            let s_options = s.options != undefined ? s.options : {};
            let s_priority = s.priority > 0 ? s.priority : 1;
            let s_spawns = s.spawns;

            let nC = creeps_by_job[ s_job ] + sched_by_job[ s_job ];

            while( nC < s_max ) {
                if( nC < s_min ) {
                    this.scheduleCreep( s.role, s.body, s_job, s_options, s_priority, s_spawns)
                } else {
                    this.scheduleCreep( s.role, s.body, s_job, s_options, 0, s_spawns );
                }
                nC++;
            }
        }

        Memory.creep_sched.sort( function( x, y ) {
            let dP = y.priority - x.priority;
            return dP;
        });
    },

    scheduleCreep: function( role, body, job, options, priority, spawns ) {
        console.log( "Scheduling " + job);
        if( Memory.creep_sched == undefined ) {
            Memory.creep_sched = [];
            Memory.sched_ctr = 1;
        }
        sched_id = 'SC:' + Memory.sched_ctr++;
        memory = {role: role, job: job, newborn: true};
        for( option in options ) {
            memory[option] = options[option];
        }
        creep = {id: sched_id, role: role, job: job, body: body,
                memory: memory, priority: priority,
                req_time: Game.time, spawns: spawns};
        Memory.creep_sched.push( creep );
        return creep;
    },

    runSpawn: function( ) {
        var common = require('Common');
        let available_spawns_array = _.filter( Game.spawns, (x) => x.spawning == undefined );

        if( available_spawns_array.length == 0 ) {
            console.log( "No Spawns" );
            return;
        }

        let cS = Memory.creep_sched;

        //console.log( "High pri creeps are " + cS[0].priority)
        let spawnInfo = {};
        for( let spawn of available_spawns_array ) {
            let extensions = spawn.room.find( FIND_MY_STRUCTURES, {
                filter: (x) => x.structureType == STRUCTURE_EXTENSION
            } );
            let energyAvailable = spawn.energy + _.sum( _.map( extensions, (x) => x.energy ));
            let energyCapacity = spawn.energyCapacity + _.sum( _.map( extensions, (x) => x.energyCapacity  ) );
            let sI = {
                energy: energyAvailable,
                energyCapacity: energyCapacity
            }
            spawnInfo[spawn.id] = sI;
        }

        for( c of cS ) {
            energyRequired = common.calculateBodyCost( c.body );
            for( s_id in spawnInfo ) {
                s = Game.getObjectById( s_id );
                energyAvailable = spawnInfo[s_id].energy;
                energyCapacity = spawnInfo[s_id].energyCapacity;
                spawns_available = true;
                console.log( "Spawn energy available/capacity/required for " + s.name +
                            " = " + energyAvailable + "/" +
                            energyCapacity + "/" + energyRequired);
                if( energyCapacity < energyRequired ) {
                    console.log( "Not enough energy in Spawn")
                    continue;    ///// NOT THIS ONE
                }
                if( c.spawns == undefined || _.filter( c.spawns, (x) => x == s.id).length > 0 ) {
                    // thats handy Harry - shove it in the oven!
                    err = 99;
                    err = s.spawnCreep( c.body, c.role + ':' + c.id, {memory: c.memory} );
                    console.log( "Spawn attempt returned " + err + " for " + c.job)
                    //return
                    if( err == 0 ) {
                        spawnInfo[s_id] = undefined;
                        cS = _.filter( cS, (x) => x.id != c.id );
                        break;
                    } else {
                        c.launchFailError = err;
                        if( err == ERR_NOT_ENOUGH_RESOURCES ) {
                            spawnInfo[s_id] = undefined; // reserve it
                            c.reservationTime = Game.time;
                        } else {
                            console.log( "Spawn attempt failed with error " + err );
                        }
                    }
                } else {
                    console.log( "Spawn not suitable");
                }
            }
            if( Object.values( spawnInfo ).length == 0 ) {
                /// no more spawns available
                break;
            }
        }
        Memory.creep_sched = cS;
    }
};

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
        liveCreeps = _.filter(Game.creeps, (x) => true );

        creeps_by_job = {};
        for( j in plan ) {
            creeps_by_job[ j ] = 0;
        }

        for( c of liveCreeps ) {
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

        sched_by_job = {};
        _.map( plan, (x,y) => sched_by_job[y] = 0);
        _.map( Memory.creep_sched, (x) => sched_by_job[x.job] = 0);
        _.map( Memory.creep_sched, (x) => sched_by_job[x.job]++ );

        for( creepJob in plan ) {
            s = plan[creepJob];
            s_min = s.min > 0 ? s.min : 1;
            s_max = s.max > 0 ? s.max : 1;
            s_job = s.job != undefined ? s.job : s.role;
            s_options = s.options != undefined ? s.options : {};
            s_priority = s.priority > 0 ? s.priority : 1;
            s_spawns = s.spawns;

            nC = creeps_by_job[ s_job ] + sched_by_job[ s_job ];

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
        common = require('Common');
        available_spawns_array = _.filter( Game.spawns, (x) => x.spawning == undefined );

        if( available_spawns_array.length == 0 ) {
            console.log( "No Spawns" );
            return;
        }

        cS = Memory.creep_sched;

        //console.log( "High pri creeps are " + cS[0].priority)
        spawnInfo = {};
        for( let spawn of available_spawns_array ) {
            extensions = spawn.room.find( FIND_MY_STRUCTURES, {
                filter: (x) => x.structureType == STRUCTURE_EXTENSION
            } );
            energyAvailable = spawn.energy + _.sum( _.map( extensions, (x) => x.energy ));
            energyCapacity = spawn.energyCapacity + _.sum( _.map( extensions, (x) => x.energyCapacity  ) );
            sI = {
                energy: energyAvailable,
                energyCapacity: energyCapacity
            }
            spawnInfo[spawn.id] = sI;
        }

        for( c of cS ) {
            reserved_spawn = undefined;
            body  = c.body;
            energyRequired = common.calculateBodyCost( body );
            let spawns_available = false;
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
                    spawns_available = true;
                    // thats handy Harry - shove it in the oven!
                    err = 99;
                    err = s.spawnCreep( c.body, c.role + ':' + c.id, {memory: c.memory} );
                    console.log( "Spawn attempt returned " + err + " for " + c.job)
                    //return
                    if( err == 0 ) {
                        spawnInfo[s_id] = undefined;
                        reserved_spawn = undefined;
                        cS = _.filter( cS, (x) => x.id != c.id );
                        break;
                    } else {
                        if( err == ERR_NOT_ENOUGH_RESOURCES ) {
                            spawnInfo[s_id] = undefined; // reserve it
                            c.reservationTime = Game.time;
                        } else {
                            console.log( "Spawn attempt failed with error " + err )
                            c.launchFailError = err;
                        }
                    }
                } else {
                    console.log( "Spawn not suitable");
                    spawns_available = true;
                }
            }
            if( spawns_available == false ) {
                break;
            }
        }
        Memory.creep_sched = cS;
    }
};

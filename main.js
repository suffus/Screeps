module.exports = {
    defCreepMods: ['DedicatedHarvester', 'Harvester', 'Defender',
                'RemoteHarvester', 'Healer', 'EnergyTrain',
                'Claimer', 'Builder', 'Repairer', 'TopUp',
                'Brickie', 'MineralHarvester', 'Reserver', 'RemoteHauler'],

    defRoomMods: [ 'Link', 'Defence', 'StructurePlanner'],


    creep_controllers: {},
    room_controllers: [],

    registerController: function( name ) {
        var controller = require( name );
        if( controller.type != undefined ) {
            this.creep_controllers[controller.type] = controller;
        }
        return controller;
    },

    registerRoomController: function( name ) {
        var controller = require(name);
        this.room_controllers.push( controller );
    },

    common: require('Common'),

    loop: function() {
        var common = this.common;
        if( Memory.deprecatedStructures === undefined ) {
            Memory.deprecatedStructures = {}
        }
        if( Memory.reload == true ) {
          this.creep_controllers = {};
          this.room_controllers = [];
          Memory.reload = false;
          Memory.jobPlan = undefined;
          Memory.controller_reloads = 0;
        }

        if( Object.values( this.creep_controllers ).length == 0  ) {
          this.creep_controllers = {};
          for( let mod of this.defCreepMods ) {
            this.registerController( mod );
          }
          ++Memory.controller_reloads;
        }
        if( this.room_controllers.length == 0 ) {
          this.room_controllers = [];
          for( let mod of this.defRoomMods ) {
            this.registerRoomController( mod );
          }
        }

        var spawnControl = require('SpawnControl');
        var workerControl = require( 'WorkforceManager');

        let thePlan = undefined;
        if( Memory.jobPlan == undefined || ((Game.time % 17) == 3) || (Memory.defcon > 0)  ) {
            thePlan = workerControl.create_plan( this.creep_controllers );
            Memory.jobPlan = thePlan;
            Memory.creep_sched = [];
            spawnControl.schedulePlan( thePlan );
        }

        var creep_controllers = this.creep_controllers;
        for (let name in Memory.creeps) {
            // and checking if the creep is still alive
             if (Game.creeps[name] == undefined) {
                // if not, delete the memory entry
                delete Memory.creeps[name];
            }
        }

        console.log("Running room "+Game.spawns['Spawn1'].room.name+" at time " + Game.time);

        for( let rc of this.room_controllers ) {
            if( rc.beforeRoom !== undefined ) {
                rc.beforeRoom();
            }
        }

        for( let room in common.roomInfo ) {
            for( rc of this.room_controllers ) {
                //console.log('Runnin room ' + room + " with " +rc.name+" "+i);
                rc.runRoom( room, common.roomInfo[room] );
            }
        }

        for( let rc of this.room_controllers ) {
            if( rc.afterRoom != undefined ) {
                rc.afterRoom();
            }
        }

        ///// main creep execution loop
        for( let name in Game.creeps ) {
            let creep = Game.creeps[name];
            let controller = creep_controllers[creep.memory.role];
            if( controller != undefined ) {
                controller.run( creep );
            } else {
                console.log("No controller for "+creep.memory.role+", do not expect creep " + creep.name + " to do much!");
            }
        }

        if( Game.time % 3 == 0 ) {
          spawnControl.runSpawn();
        }

        this.doRepairsAndBuilding()

        if( (Game.time % 383) == 0 ) {
           //// this.buildAndRepairRemote();
        }
        if( Memory.useStorage > 0 ) {
            Memory.useStorage--;
        }
    },

    doRepairsAndBuilding: function() {
        let remotes = [];
        if( (Game.time - Memory.lastRepairCalcTime ) < 109 ) {
            return
        }

        var common = require('Common');
        Memory.myStructures = {};
        for( let rm in common.roomInfo ) {
            let room = common.roomInfo
            let cR = Game.rooms[rm]
            if( !cR ) {
              continue
            }
            let cS = cR.find(FIND_MY_CONSTRUCTION_SITES)
            let sS = cR.find(FIND_MY_STRUCTURES, {filter: (x) => x.structureType !== STRUCTURE_RAMPART})
            let roads = cR.find( FIND_STRUCTURES, {filter: (x) => x.structureType === STRUCTURE_ROAD} )
            roads.map( x => sS.push(x) )
            let constructionEnergyRequired = 0
            cS.map( (x) => {constructionEnergyRequired += (x.progressTotal - x.progress)} )
            let maxE = room.maxConstructionEnergy || 10000;
            if( constructionEnergyRequired > maxE ) {
                constructionEnergyRequired = maxE
            }
            let repairEnergyRequired = 0
            sS.map( (x) => {repairEnergyRequired += (x.hitsMax - x.hits) })
            Memory.myStructures[rm] = {...sS}
            repairEnergyRequired /= 20
            remotes.push( {room: rm, construction: constructionEnergyRequired, repairs: repairEnergyRequired})
        }
        console.log( JSON.stringify( remotes ))
        let builderRepairers = {}

        for( let cN in Game.creeps ) {
            let x = Game.creeps[cN]
            if( x.memory.role === "builder" || x.memory.role === "repairer"  ) {
                builderRepairers[cN] = x
            }
        }
        for( let creep of Object.values(builderRepairers) ) {
               let wC = 0
               creep.body.map( (x) => {if(x.type === WORK) {wC += 2000}} )
               creep.memory.workCapacity = wC*0.6  ///// per 1000 ticks given energy acquisition and move
               if( creep.memory.ticksToLive < 200 ) {
                   creep.memory.workCapacity *= creep.memory.ticksToLive/200
               }

        }
        let mappedConstructionWorkers = {}
        let needRepairs = true
        while( Object.keys(builderRepairers).length > 0 && needRepairs ) {
            needRepairs = false
            remotes = remotes.sort( (a,b) => b.repairs - a.repairs)
            for( let rm of remotes ) {
                let workforce = mappedConstructionWorkers[rm] || {repairers: [], builders: []}
                if( rm.repairEnergyRequired > (rm.minRepairEnergy || 2000) ) {
                    needRepairs = true
                    let theCreep = null
                    let creepScores = {}
                    for( let creep of builderRepairers ) {
                        creepScores[creep.name] = 0
                        if( creep.pos.roomName == rm ) {
                            creepScores[creep.name] += 10000
                        }
                        if( creep.memory.job == "repairer" ) {
                            creepScores[creep.name] += 1000
                        }
                        if( creep.memory.workCapacity > rm.repairEnergyRequired ) {
                            creepScores[creep.name] -= (creep.memory.workCapacity - rm.repairEnergyRequired)
                        } else {
                            creepScores[creep.name] -= (rm.repairEnergyRequired - creep.memory.workCapacity)
                        }
                    }
                    let c0 = Object.entries(creepScores).sort( (x,y) => y[1] - x[1] )
                    if( c0.length > 0 ) {
                        let theCreep = builderRepairers[c0[0][0]]
                        rm.repairs -= theCreep.memory.workCapacity
                        delete builderRepairers[theCreep.name]
                        theCreep.memory.job="repairer"
                        theCreep.memory.role="repairer"
                        theCreep.memory.current_site = undefined
                        if( theCreep.pos.roomName != rm.room ) {
                            theCreep.memory.targetFlag = common.roomInfo[rm.room].flag
                        }
                    }
                }
            }
        }
        let needBuilding = true
        while( Object.keys(builderRepairers).length > 0 && needBuilding ) {
            needBuilding = false
            remotes = remotes.sort( (x,y) => y.construction-x.construction )
            for( let rm of remotes ) {
                if( rm.construction > 0 ) {
                    needBuilding = true
                    let creepScores = {}
                    for( let creep of Object.values(builderRepairers) ) {
                        creepScores[creep.name] = 0
                        if( creep.pos.roomName == rm.room ) {
                            creepScores[creep.name] += 10000
                        }
                        if( creep.memory.job == "builder" ) {
                            creepScores[creep.name] += 1000
                        }
                         if( creep.memory.workCapacity > rm.construction ) {
                            creepScores[creep.name] -= (creep.memory.workCapacity - rm.construction)
                        }
                    }
                    let c0 = Object.entries( creepScores ).sort((x,y) => y[1] - x[1])
                    if( c0.length > 0 ) {
                        let theCreep = builderRepairers[c0[0][0]]
                        rm.construction -= theCreep.memory.workCapacity
                        delete builderRepairers[theCreep.name]
                        theCreep.memory.job="builder"
                        theCreep.memory.role="builder"
                        theCreep.memory.current_site = undefined
                        if( theCreep.pos.roomName != rm.room ) {
                            theCreep.memory.targetFlag = common.roomInfo[rm.room].flag
                        }
                    }
                }
            }
        }
        Memory.lastRepairCalcTime = Game.time
    },

    buildAndRepairRemote: function( role, r ) {
        var remotes = common.roomInfo;

        if( r == undefined ) {
            r = remotes[ Math.floor( Math.random() * remotes.length )];

        }
        var room = Game.rooms[r];
        flag = common.roomInfo[r].flag;

        if( role == undefined ) {
            role = 'repairer';
        }
        creeps = _.filter( Game.creeps, (x) => x.memory.role == role && x.pos.roomName != r );
        if( creeps != undefined && creeps[creeps.length - 1] != undefined ) {
            creep = creeps[creeps.length - 1];
            console.log("**** Sending " + creep.name + " to flag " + flag + " as a " + role);
            creep.memory.working  = true;
            creep.memory.targetFlag = flag;
        } else {
            console.log( "**** Remote repairing - no creeps available")
        }
    },
    obs:'[6:50:00 PM][shard0][{"room":"E8S21","construction":0,"repairs":142569.95},{"room":"E8S22","construction":4254,"repairs":0}]"'
}

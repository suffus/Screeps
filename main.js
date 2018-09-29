

module.exports = {
    
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
    
    loop: function() {
        this.creep_controllers = {};
        this.room_controllers = [];
        var common = require('Common');

        var dedicatedHarvester = this.registerController('DedicatedHarvester');
        var harvesterRole = this.registerController('Harvester');
        var remoteHarvester = this.registerController('RemoteHarvester');
        var defender = this.registerController('Defender');
        var healer = this.registerController( 'Healer');
        this.registerController( 'EnergyTrain' )
        var claimer = this.registerController( 'Claimer' );
        var builderRole = this.registerController('Builder');
        var repairerRole = this.registerController('Repairer');
        var topUpRole = this.registerController('TopUp');
        var brickieRole = this.registerController('Brickie');
        var mineralRole = this.registerController('MineralHarvester');
        //var invalidRole = this.registerController( 'Invalid' );
        
        var linkControl = this.registerRoomController('Link');
        var defenceControl = this.registerRoomController('Defence');
        var structurePlanner = this.registerRoomController('StructurePlanner');
        
        var spawnControl = require('SpawnControl');
        var workerControl = require( 'WorkforceManager');
        
        thePlan = undefined;
        if( Memory.jobPlan == undefined || ((Game.time % 7) == 3)  ) {
            thePlan = workerControl.create_plan( this.creep_controllers );
            Memory.jobPlan = thePlan;
            Memory.creep_sched = [];
            spawnControl.schedulePlan( thePlan );
        }
        
        var creep_controllers = this.creep_controllers;
        
        var num_creeps= {};
        var num_non_zombies={};
        var creeps_by_role = {};
        for( let t in creep_controllers ) {
            num_creeps[t] = 0;
            num_non_zombies[t]=0;
            creeps_by_role[t] = [];
        }
        
        for (let name in Memory.creeps) {
            // and checking if the creep is still alive
             if (Game.creeps[name] == undefined) {
                // if not, delete the memory entry
                delete Memory.creeps[name];
            }
        }
        
        console.log("Running room "+Game.spawns['Spawn1'].room.name+" at time " + Game.time);
        i=0;
        
        for( rc of this.room_controllers ) {
            if( rc.beforeRoom != undefined ) {
                rc.beforeRoom();
            }
        }
        
        for( room in common.roomInfo ) {
            for( rc of this.room_controllers ) {
                //console.log('Runnin room ' + room + " with " +rc.name+" "+i);
                rc.runRoom( room );
            }
        }
        
        for( rc of this.room_controllers ) {
            if( rc.afterRoom != undefined ) {
                rc.afterRoom();
            }
        }

        
        ///// main creep execution loop
        for( let name in Game.creeps ) {
            var creep = Game.creeps[name];
            var arr = creeps_by_role[creep.memory.role];
            if( arr != undefined ) { 
                arr.push(creep);
            } else { /// should not happen
                console.log( "Unexpected creep type: "+creep.memory.role);
            }
            num_creeps[creep.memory.role]++;
            if( creep.ticksToLive > 150) {
                num_non_zombies[creep.memory.role]++;
            }
            
            var controller = creep_controllers[creep.memory.role];
            if( controller != undefined ) {
                controller.run( creep );
            } else {
                console.log("No controller for "+creep.memory.role+", do not expect creep " + creep.name + " to do much!");
            }
        }

        this.runSchedule1( num_creeps, num_non_zombies );
        
        ////spawnControl.runSpawn();
        
        
        if( (Game.time % 383) == 0 ) {
            if( (Game.time % 3) == 0  ) {
                common.roleGotoFlag( 'upgrader', 1, 'Flag2')
            }
            common.buildAndRepairRemote();
        }
        if( Memory.useStorage > 0 ) {
            Memory.useStorage--;
        }
    },
    
    runSchedule1: function( num_creeps, num_non_zombies ) {
        creep_controllers = this.creep_controllers;
        room_controllers = this.room_controllers;
        
        var numDesc = "";
        for( let type in num_creeps ) {
            numDesc += type+": "+num_creeps[type]+", ";
        }
        console.log("Number of creeps = "+numDesc);
        if( num_creeps['harvester']==0) {
            Game.notify('No Harvesters!',30);  //// eek - urgent manual action required!
            Memory.useStorage += 1200;
            /// forcibly acquire one that is not a dedi
            let creeps = _.filter( Game.creeps, (x) => x.memory.role != 'dedicated_harvester' && 
                                                        _.filter( x.body, (b) => b.type == CARRY && b.hits > 50 ).length > 0 &&
                                                        _.filter( x.body, (b) => b.type == MOVE && b.hits > 50 ).length > 0
            );
            if( creeps.length > 0 ) {
                creep_controllers['harvester'].force_convert( creeps[creeps.length -1] );
            }
            
        }
        var eA = 0;
        var capacity = 0;
        eA = _(Game.structures).filter( (x) => {return x.structureType == STRUCTURE_EXTENSION || x.structureType == STRUCTURE_SPAWN} ).map( (x) => x.energy ).sum();
        capacity = _(Game.structures).filter( (x) => {return x.structureType == STRUCTURE_EXTENSION || x.structureType == STRUCTURE_SPAWN} ).map( (x) => x.energyCapacity ).sum();
        console.log("Spawn Energy Available="+eA+", capacity="+capacity);
        
        if( eA >= 600 ) { //capacity - 100 ) {
            console.log('Trying to spawn');
            
            var creep_mem;
            var body = common.createWorkerBody( eA );
            var role = undefined;
            var creepEnergy = eA;
            
            var spawn = Game.spawns.Spawn1;
            
            
            for( let c in creep_controllers ) {
                controller = creep_controllers[c];
                if( controller.do_not_create == undefined ) {
                    if( num_non_zombies[c] < controller.min(Game.spawns.Spawn1.room) ) {
                        role = c;
                        break;
                    }
                }
            }
            if( role == undefined ) {
                var mn = 1000;
                var min_role = undefined;
                for( let r in num_creeps ) {
                    if( r == 'defender' || role == 'dedicated_harvester' ) {
                        continue;
                    }
                    if( creep_controllers[r].max() <= num_non_zombies[r]) {
                        continue;
                    }
                    if(num_creeps[r] < mn) {
                        mn = num_non_zombies[r];
                        min_role = r;
                    }
                }
                role = min_role;
            }
            if( role != undefined ) {
                controller = creep_controllers[role];
                if( controller.max_energy != undefined ) {
                    if( controller.max_energy() < eA ) {
                        creepEnergy = controller.max_energy();
                    } 
                }
                if( controller.createBody != undefined ) {
                    body = controller.createBody( creepEnergy, Game.spawns.Spawn1.room );
                }
                if( controller.createMem != undefined ) {
                    creep_mem = controller.createMem( Game.spawns.Spawn1.room );
                }
        
            
                if( role == 'dedicated_harvester' ) {
                    role = 'dedicated_harvester';
                    var src = creep_controllers['dedicated_harvester'].getTarget( Game.spawns['Spawn1'].room.name );
                    if( src == undefined || src[0] == undefined) {
                        console.log("ERR - undefined src for dedi")
                        //role = ''
                    } else {
                        
                        body=creep_controllers['dedicated_harvester'].createBody( eA );
                        creep_mem = {role:role, working:false, source:src[0].id};
                    }
                }
            
            
                var rval;
                if( role=='remoteHarvester') {
                    if( controller.min_energy() > creepEnergy ) {
                        rval = ERR_NOT_ENOUGH_RESOURCES;
                        
                    } else {
                        var target = undefined;
                        for( let r in common.roomInfo ) {
                            if( r == common.home ) {
                                continue;
                            }
                            target = r;
                            nH = 2;
                            rI = common.roomInfo[target];
                            if( rI.workforce != undefined && rI.workforce['remoteHarvester'] != undefined) {
                                nH = rI.workforce['remoteHarvester'];
                            } else {
                                console.log( '****************  No workforce for remote room!')
                            }
                            if( _.filter( Object.values(Game.creeps), (x) => x.memory.role == 'remoteHarvester' && x.memory.target == r && x.ticksToLive > 100 ).length >= nH ) {
                                continue;
                            } else {
                                break;
                            }
                        }
                        rval = creep_controllers['remoteHarvester'].createCreep( Game.spawns.Spawn1, target, creepEnergy);
                    }
                } else { 
                    controller = creep_controllers[role];
                    if( controller.min_energy == undefined || controller.min_energy() <= creepEnergy ) {
                        rval = Game.spawns['Spawn1'].createCreep(body, undefined, creep_mem != undefined ? creep_mem : {role: role, working: false});
                    } else {
                        console.log( "Controller for "+role+" says not enough energy yet " + controller.min_energy() );
                        rval = ERR_NOT_ENOUGH_RESOURCES;
                    }
                }
                bodyString = role + ':' + _.map( body, (x) => x.part+":"+x.quantity).join(',');
                console.log( rval + " returned for " + bodyString );
            } else { /// role is undefined
                console.log( 'No more creeps to create!');
            }
            
        }
        
        //// ensure we have enough dedicated harvesters or we waste energy
        if( num_creeps['dedicated_harvester'] < 2 ) {
            if( num_creeps['dedicated_harvester'] == 0 ) {
                Game.notify( 'No Dedis');
                Memory.useStorage += 1200;
            }
            var creep_to_convert;
            for( r of ['brickie', 'repairer', 'builder', 'upgrader'] ) { 
                var candidates = _.filter( Game.creeps, (x) => x.memory.role == r && x.pos.roomName == Game.spawns.Spawn1.room.name);
                if( candidates != undefined && candidates[0] != undefined ) {
                    creep_to_convert = candidates[0];
                    break;
                }
            }
            if( creep_to_convert != undefined ) {
                console.log("*** CONVERTING "+creep_to_convert.name+ " TO BE A DEDI (WAS A "+creep_to_convert.memory.role+")")
                creep_controllers['dedicated_harvester'].force_convert( creep_to_convert );
            } else {
                console.log("Could not find a creep to convert to a dedicated harvester");
            }
        }        
    }
    

}
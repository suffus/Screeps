

module.exports = {
  defCreepMods: ['DedicatedHarvester', 'Harvester', 'Defender',
                'RemoteHarvester', 'Healer', 'EnergyTrain',
                'Claimer', 'Builder', 'Repairer', 'TopUp',
                'Brickie', 'MineralHarvester', 'Reserver'],

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

    loop: function() {
          this.creep_controllers = {};
          this.room_controllers = [];
        var common = require('Common');
        if( Memory.reload == true  || true  ) {
          for( let mod of this.defCreepMods ) {
            this.registerController( mod );
          }
          for( let mod of this.defRoomMods ) {
            this.registerRoomController( mod );
          }
        }

        var spawnControl = require('SpawnControl');
        var workerControl = require( 'WorkforceManager');

        let thePlan = undefined;
        if( Memory.jobPlan == undefined || ((Game.time % 17) == 3) || Memory.defcon > 0  ) {
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
            if( rc.beforeRoom != undefined ) {
                rc.beforeRoom();
            }
        }

        for( let room in common.roomInfo ) {
            for( rc of this.room_controllers ) {
                //console.log('Runnin room ' + room + " with " +rc.name+" "+i);
                rc.runRoom( room );
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

        if( (Game.time % 383) == 0 ) {
            common.buildAndRepairRemote();
        }
        if( Memory.useStorage > 0 ) {
            Memory.useStorage--;
        }
    }
}

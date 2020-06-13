import { on, Actor, Game, TESModPlatform, printConsole, storage, GlobalVariable, Debug} from "skyrimPlatform"

class Ni3Point{
    constructor(public x:number, public y:number, public z:number){};

    OperatorMinus(point:Ni3Point) : Ni3Point{
        return new Ni3Point(this.x - point.x, this.y - point.y, this.z -point.z);
    };

    Pow(exponent:number):Ni3Point{
        return new Ni3Point(Math.pow(this.x, exponent), Math.pow(this.y, exponent), Math.pow(this.z, exponent));
    };
}

let GetDistance = (firstPoint:Ni3Point, secondPoint:Ni3Point) : number =>{
    let deltaPos = firstPoint.OperatorMinus(secondPoint);
    let powDeltaPos = deltaPos.Pow(2);
    return Math.sqrt(powDeltaPos.x + powDeltaPos.y + powDeltaPos.z);
};

let GetActorPos = (actor:Actor):Ni3Point=>{
    if(!actor) return new Ni3Point(0,0,0);
    return new Ni3Point(actor.getPositionX(), actor.getPositionY(), actor.getPositionZ());
};

let CompareActorsPos = (point:Ni3Point, firstActor:Actor, secondActor:Actor) : Actor=>{

    if(!firstActor || !secondActor) return null;

    let distanceFromFirstActor = GetDistance(point, GetActorPos(firstActor));
    let distanceFromSecondActor = GetDistance(point, GetActorPos(secondActor));

    return distanceFromFirstActor > distanceFromSecondActor ? secondActor : firstActor;
};

let FindClosestAgresiveActor = (actor:Actor, radius:number) : Actor =>{

    if(!actor) return null;
    let startPos = GetActorPos(actor);
    let res:Actor = null;
    for(let i = 0; i < 50; ++i){

        let randomActor = Game.findRandomActor(startPos.x, startPos.y, startPos.z, radius);
        if(!randomActor)continue;

        let combatTargetForClosestActor = randomActor.getCombatTarget();
        if(!combatTargetForClosestActor) continue;

        if(combatTargetForClosestActor.getFormID() === actor.getFormID()){
            res = res ? CompareActorsPos(startPos, res, randomActor) : randomActor;
        }
    }
    return res;
};


export let run = () => {
    let startTime = Date.now();
    let startTimeToInclude = Date.now();
    storage.npcInCombat = new Set<number>();
    storage.npcInChangeCombatState = new Set<number>();

    let needToInclude:number = 0;

    on("combatState",(event)=>{
        let player = Game.getPlayer();
        
        if(event.isCombat === true && event.isSearching === false){
            
            if(event.actor && event.actor.getFormID() === player.getFormID()){
                if(event.target){
                    storage.npcInCombat.add(event.target.getFormID());
                    TESModPlatform.setWeaponDrawnMode(Actor.from(event.target), 1);
                    return;
                }
            }
            if(event.target && event.target.getFormID() === player.getFormID()){
                if(event.actor){
                    storage.npcInCombat.add(event.actor.getFormID());
                    TESModPlatform.setWeaponDrawnMode(Actor.from(event.actor), 1);
                    return;
                }
            }
        }

        if(event.isCombat === false && event.isSearching === true){

            if(event.actor && storage.npcInCombat.has(event.actor.getFormID())){
                if(Actor.from(event.actor).isInCombat()){
                    TESModPlatform.setWeaponDrawnMode(Actor.from(event.actor), -1);
                    storage.npcInCombat.delete(event.actor.getFormID());
                    return;
                }
            }

            if(event.target && storage.npcInCombat.has(event.target.getFormID())){
                if(Actor.from(event.target).isInCombat()){
                    TESModPlatform.setWeaponDrawnMode(Actor.from(event.target), -1);
                    storage.npcInCombat.delete(event.target.getFormID());
                    return;
                }
            }
        }

        if(event.isCombat === false && event.isSearching === false){

            if(event.actor && storage.npcInCombat.has(event.actor.getFormID())){
               
                if(storage.npcInChangeCombatState.has(event.actor.getFormID())){
                    storage.npcInChangeCombatState.delete(event.actor.getFormID());
                    return;
                }
                if(!Actor.from(event.actor).isInCombat()){
                    TESModPlatform.setWeaponDrawnMode(Actor.from(event.actor), -1);
                    storage.npcInCombat.delete(event.actor.getFormID());
                    return;
                }
            }
            if(event.target && storage.npcInCombat.has(event.target.getFormID())){

                if(storage.npcInChangeCombatState.has(event.target.getFormID())){
                    storage.npcInChangeCombatState.delete(event.target.getFormID());
                    return;
                }
                if(!Actor.from(event.target).isInCombat()){
                    TESModPlatform.setWeaponDrawnMode(Actor.from(event.target), -1);
                    storage.npcInCombat.delete(event.target.getFormID());
                    return;
                }
            }
        }
    });

    on('update', () => {

    let player = Game.getPlayer();
    let timeNow = Date.now();
    let timeNowForInclude = Date.now();
    let radius = 5000;
    let can:boolean = timeNow - startTime > 400;
    let timeToCheck:boolean = timeNowForInclude - startTimeToInclude > 3000;  
    
    if(timeToCheck){
        startTimeToInclude = timeNowForInclude;

       let form = Game.getFormFromFile(0x0005Ba28, "MZ_DIFFICULTY.esp");
       
       let globalVar = GlobalVariable.from(form);
       if(globalVar){
        needToInclude = globalVar.getValue();
       }
        
       if(!needToInclude && (storage.npcInCombat.size > 0 || storage.npcInChangeCombatState.size > 0)){
        storage.npcInCombat.clear();
        storage.npcInChangeCombatState.clear();
       }
    }

    if(player && can && needToInclude){
        startTime = timeNow;

        if(storage.npcInCombat.size < 1)
            return;        

            storage.npcInCombat.forEach((value, valueAgain, set) =>{
        let target = Actor.from(Game.getFormEx(value));

        let closestAgresiveActorForFoundNPC = FindClosestAgresiveActor(target, radius);
        let nowTarget = target.getCombatTarget();
        if(target && closestAgresiveActorForFoundNPC && nowTarget&& nowTarget.getFormID() !== closestAgresiveActorForFoundNPC.getFormID()) {
            
            storage.npcInChangeCombatState.add(target.getFormID());
            target.stopCombat();
            target.startCombat(closestAgresiveActorForFoundNPC);
        };
    });
}
});
};


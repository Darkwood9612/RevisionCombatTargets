System.register("Steam/steamapps/common/Skyrim Special Edition/Data/Platform/Modules/skyrimPlatform", [], function (exports_1, context_1) {
    "use strict";
    var MotionType;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            (function (MotionType) {
                MotionType[MotionType["Dynamic"] = 1] = "Dynamic";
                MotionType[MotionType["SphereInertia"] = 2] = "SphereInertia";
                MotionType[MotionType["BoxInertia"] = 3] = "BoxInertia";
                MotionType[MotionType["Keyframed"] = 4] = "Keyframed";
                MotionType[MotionType["Fixed"] = 5] = "Fixed";
                MotionType[MotionType["ThinBoxInertia"] = 6] = "ThinBoxInertia";
                MotionType[MotionType["Character"] = 7] = "Character";
            })(MotionType || (MotionType = {}));
            exports_1("MotionType", MotionType);
            ;
        }
    };
});
System.register("Darkwood/WorkSkyMP/SkyrimMultiplayer/skyrimplatform-plugin-example/src/RevisionCombatTargets", ["Steam/steamapps/common/Skyrim Special Edition/Data/Platform/Modules/skyrimPlatform"], function (exports_2, context_2) {
    "use strict";
    var skyrimPlatform_1, Ni3Point, GetDistance, GetActorPos, CompareActorsPos, FindClosestAgresiveActor, run;
    var __moduleName = context_2 && context_2.id;
    return {
        setters: [
            function (skyrimPlatform_1_1) {
                skyrimPlatform_1 = skyrimPlatform_1_1;
            }
        ],
        execute: function () {
            Ni3Point = /** @class */ (function () {
                function Ni3Point(x, y, z) {
                    this.x = x;
                    this.y = y;
                    this.z = z;
                }
                ;
                Ni3Point.prototype.OperatorMinus = function (point) {
                    return new Ni3Point(this.x - point.x, this.y - point.y, this.z - point.z);
                };
                ;
                Ni3Point.prototype.Pow = function (exponent) {
                    return new Ni3Point(Math.pow(this.x, exponent), Math.pow(this.y, exponent), Math.pow(this.z, exponent));
                };
                ;
                return Ni3Point;
            }());
            GetDistance = function (firstPoint, secondPoint) {
                var deltaPos = firstPoint.OperatorMinus(secondPoint);
                var powDeltaPos = deltaPos.Pow(2);
                return Math.sqrt(powDeltaPos.x + powDeltaPos.y + powDeltaPos.z);
            };
            GetActorPos = function (actor) {
                if (!actor)
                    return new Ni3Point(0, 0, 0);
                return new Ni3Point(actor.getPositionX(), actor.getPositionY(), actor.getPositionZ());
            };
            CompareActorsPos = function (point, firstActor, secondActor) {
                if (!firstActor || !secondActor)
                    return null;
                var distanceFromFirstActor = GetDistance(point, GetActorPos(firstActor));
                var distanceFromSecondActor = GetDistance(point, GetActorPos(secondActor));
                return distanceFromFirstActor > distanceFromSecondActor ? secondActor : firstActor;
            };
            FindClosestAgresiveActor = function (actor, radius) {
                if (!actor)
                    return null;
                var startPos = GetActorPos(actor);
                var res = null;
                for (var i = 0; i < 50; ++i) {
                    var randomActor = skyrimPlatform_1.Game.findRandomActor(startPos.x, startPos.y, startPos.z, radius);
                    if (!randomActor)
                        continue;
                    var combatTargetForClosestActor = randomActor.getCombatTarget();
                    if (!combatTargetForClosestActor)
                        continue;
                    if (combatTargetForClosestActor.getFormID() === actor.getFormID()) {
                        res = res ? CompareActorsPos(startPos, res, randomActor) : randomActor;
                    }
                }
                return res;
            };
            exports_2("run", run = function () {
                var startTime = Date.now();
                var startTimeToInclude = Date.now();
                skyrimPlatform_1.storage.npcInCombat = new Set();
                skyrimPlatform_1.storage.npcInChangeCombatState = new Set();
                var needToInclude = 0;
                skyrimPlatform_1.on("combatState", function (event) {
                    var player = skyrimPlatform_1.Game.getPlayer();
                    if (event.isCombat === true && event.isSearching === false) {
                        if (event.actor && event.actor.getFormID() === player.getFormID()) {
                            if (event.target) {
                                skyrimPlatform_1.storage.npcInCombat.add(event.target.getFormID());
                                skyrimPlatform_1.TESModPlatform.setWeaponDrawnMode(skyrimPlatform_1.Actor.from(event.target), 1);
                                return;
                            }
                        }
                        if (event.target && event.target.getFormID() === player.getFormID()) {
                            if (event.actor) {
                                skyrimPlatform_1.storage.npcInCombat.add(event.actor.getFormID());
                                skyrimPlatform_1.TESModPlatform.setWeaponDrawnMode(skyrimPlatform_1.Actor.from(event.actor), 1);
                                return;
                            }
                        }
                    }
                    if (event.isCombat === false && event.isSearching === true) {
                        if (event.actor && skyrimPlatform_1.storage.npcInCombat.has(event.actor.getFormID())) {
                            if (skyrimPlatform_1.Actor.from(event.actor).isInCombat()) {
                                skyrimPlatform_1.TESModPlatform.setWeaponDrawnMode(skyrimPlatform_1.Actor.from(event.actor), -1);
                                skyrimPlatform_1.storage.npcInCombat.delete(event.actor.getFormID());
                                return;
                            }
                        }
                        if (event.target && skyrimPlatform_1.storage.npcInCombat.has(event.target.getFormID())) {
                            if (skyrimPlatform_1.Actor.from(event.target).isInCombat()) {
                                skyrimPlatform_1.TESModPlatform.setWeaponDrawnMode(skyrimPlatform_1.Actor.from(event.target), -1);
                                skyrimPlatform_1.storage.npcInCombat.delete(event.target.getFormID());
                                return;
                            }
                        }
                    }
                    if (event.isCombat === false && event.isSearching === false) {
                        if (event.actor && skyrimPlatform_1.storage.npcInCombat.has(event.actor.getFormID())) {
                            if (skyrimPlatform_1.storage.npcInChangeCombatState.has(event.actor.getFormID())) {
                                skyrimPlatform_1.storage.npcInChangeCombatState.delete(event.actor.getFormID());
                                return;
                            }
                            if (!skyrimPlatform_1.Actor.from(event.actor).isInCombat()) {
                                skyrimPlatform_1.TESModPlatform.setWeaponDrawnMode(skyrimPlatform_1.Actor.from(event.actor), -1);
                                skyrimPlatform_1.storage.npcInCombat.delete(event.actor.getFormID());
                                return;
                            }
                        }
                        if (event.target && skyrimPlatform_1.storage.npcInCombat.has(event.target.getFormID())) {
                            if (skyrimPlatform_1.storage.npcInChangeCombatState.has(event.target.getFormID())) {
                                skyrimPlatform_1.storage.npcInChangeCombatState.delete(event.target.getFormID());
                                return;
                            }
                            if (!skyrimPlatform_1.Actor.from(event.target).isInCombat()) {
                                skyrimPlatform_1.TESModPlatform.setWeaponDrawnMode(skyrimPlatform_1.Actor.from(event.target), -1);
                                skyrimPlatform_1.storage.npcInCombat.delete(event.target.getFormID());
                                return;
                            }
                        }
                    }
                });
                skyrimPlatform_1.on('update', function () {
                    var player = skyrimPlatform_1.Game.getPlayer();
                    var timeNow = Date.now();
                    var timeNowForInclude = Date.now();
                    var radius = 5000;
                    var can = timeNow - startTime > 400;
                    var timeToCheck = timeNowForInclude - startTimeToInclude > 3000;
                    if (timeToCheck) {
                        startTimeToInclude = timeNowForInclude;
                        var form = skyrimPlatform_1.Game.getFormFromFile(0x0005Ba28, "MZ_DIFFICULTY.esp");
                        var globalVar = skyrimPlatform_1.GlobalVariable.from(form);
                        if (globalVar) {
                            needToInclude = globalVar.getValue();
                        }
                        if (!needToInclude && (skyrimPlatform_1.storage.npcInCombat.size > 0 || skyrimPlatform_1.storage.npcInChangeCombatState.size > 0)) {
                            skyrimPlatform_1.storage.npcInCombat.clear();
                            skyrimPlatform_1.storage.npcInChangeCombatState.clear();
                        }
                    }
                    if (player && can && needToInclude) {
                        startTime = timeNow;
                        if (skyrimPlatform_1.storage.npcInCombat.size < 1)
                            return;
                        skyrimPlatform_1.storage.npcInCombat.forEach(function (value, valueAgain, set) {
                            var target = skyrimPlatform_1.Actor.from(skyrimPlatform_1.Game.getFormEx(value));
                            var closestAgresiveActorForFoundNPC = FindClosestAgresiveActor(target, radius);
                            var nowTarget = target.getCombatTarget();
                            if (target && closestAgresiveActorForFoundNPC && nowTarget && nowTarget.getFormID() !== closestAgresiveActorForFoundNPC.getFormID()) {
                                skyrimPlatform_1.storage.npcInChangeCombatState.add(target.getFormID());
                                target.stopCombat();
                                target.startCombat(closestAgresiveActorForFoundNPC);
                            }
                            ;
                        });
                    }
                });
            });
        }
    };
});
System.register("Darkwood/WorkSkyMP/SkyrimMultiplayer/skyrimplatform-plugin-example/index", ["Darkwood/WorkSkyMP/SkyrimMultiplayer/skyrimplatform-plugin-example/src/RevisionCombatTargets"], function (exports_3, context_3) {
    "use strict";
    var RCT;
    var __moduleName = context_3 && context_3.id;
    return {
        setters: [
            function (RCT_1) {
                RCT = RCT_1;
            }
        ],
        execute: function () {
            //import * as SMC from './src/SpeedMultCompensation';
            RCT.run();
            //SMC.run();
        }
    };
});

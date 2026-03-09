import { RuneActor } from "./module/actor/actor.js";
import { RuneActorSheet } from "./module/actor/actor-sheet.js";
import { RuneItem } from "./module/item/item.js";
import { RuneItemSheet } from "./module/item/item-sheet.js";
import { RuneNPCSheet } from "./module/actor/npc-sheet.js";
import { RuneDamageDialog } from "./module/dice/damage-dialog.js";

Hooks.once("init", () => {
  console.log("RUNE RPG | Inicializando sistema...");

  CONFIG.Actor.documentClass = RuneActor;
  CONFIG.Item.documentClass = RuneItem;

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("rune-rpg", RuneActorSheet, {
    types: ["character", "npc"],
    makeDefault: true,
    label: "RUNE.SheetCharacter"
  });

  Actors.registerSheet("rune-rpg", RuneNPCSheet, {  
  types: ["npc"],  
  makeDefault: true,  
  label: "Ficha de NPC"  
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("rune-rpg", RuneItemSheet, {
    types: ["invenção", "magia", "equipamento", "arma"],
    makeDefault: true,
    label: "RUNE.SheetItem"
  });
});
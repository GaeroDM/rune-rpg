export class RuneItemSheet extends ItemSheet {

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["rune-rpg", "sheet", "item"],
      width: 450,
      height: 400,
      resizable: true
    });
  }

  get template() {
    return "systems/rune-rpg/templates/item/item-sheet.hbs";
  }

  getData() {
    const context = super.getData();
    context.system = this.item.system;
    context.item = this.item;
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
  }
}
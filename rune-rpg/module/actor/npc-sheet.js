import { RuneRollHandler } from "../dice/roll-handler.js";

export class RuneNPCSheet extends ActorSheet {

  constructor(...args) {
    super(...args);
    this._vantagens = 0;
    this._desvantagens = 0;
    this._bonus = 0;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rune-rpg", "sheet", "actor", "npc"],
      template: "systems/rune-rpg/templates/actor/npc-sheet.hbs",
      width: 520,
      height: 560,
      resizable: true
    });
  }

  getData() {
    const context = super.getData();
    context.system = this.actor.system;
    context.actor = this.actor;
    context.vantagens = this._vantagens;
    context.desvantagens = this._desvantagens;
    context.bonus = this._bonus;
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    html.find(".roll-abordagem").click(ev => this._onRollAbordagem(ev));

    html.find(".contador-btn").click(ev => {
      const tipo = ev.currentTarget.dataset.tipo;
      const delta = ev.currentTarget.dataset.dir === "up" ? 1 : -1;
      if (tipo === "vantagem") this._vantagens = Math.max(0, this._vantagens + delta);
      if (tipo === "desvantagem") this._desvantagens = Math.max(0, this._desvantagens + delta);
      if (tipo === "bonus") this._bonus = Math.max(0, this._bonus + delta);
      this.render(false);
    });

    html.find(".vigor-input").change(ev => this._onVigorChange(ev));
    html.find(".item-create").click(ev => this._onItemCreate(ev));
    html.find(".item-delete").click(ev => this._onItemDelete(ev));
    html.find(".item-edit").click(ev => this._onItemEdit(ev));
  }

  async _onRollAbordagem(ev) {
    ev.preventDefault();
    const abordagemKey = ev.currentTarget.dataset.abordagem;
    const abordagemValor = this.actor.system.abordagens[abordagemKey];
    const label = `[${this.actor.name}] ${abordagemKey.charAt(0).toUpperCase() + abordagemKey.slice(1)}`;

    await RuneRollHandler.roll({
      abordagem: abordagemValor,
      vantagens: this._vantagens,
      desvantagens: this._desvantagens,
      bonus: this._bonus,
      actor: this.actor,
      label
    });

    this._vantagens = 0;
    this._desvantagens = 0;
    this._bonus = 0;
    this.render(false);
  }

  async _onVigorChange(ev) {
    const field = ev.currentTarget.dataset.field;
    const value = parseInt(ev.currentTarget.value) || 0;
    await this.actor.update({ [`system.vigor.${field}`]: value });
  }

  async _onItemCreate(ev) {
    ev.preventDefault();
    const tipo = ev.currentTarget.dataset.tipo ?? "equipamento";
    await Item.create({ name: `Nova ${tipo}`, type: tipo }, { parent: this.actor });
  }

  async _onItemDelete(ev) {
    ev.preventDefault();
    const itemId = ev.currentTarget.closest(".item").dataset.itemId;
    await this.actor.items.get(itemId)?.delete();
  }

  async _onItemEdit(ev) {
    ev.preventDefault();
    const itemId = ev.currentTarget.closest(".item").dataset.itemId;
    this.actor.items.get(itemId)?.sheet.render(true);
  }
}
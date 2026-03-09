import { RuneRollHandler } from "../dice/roll-handler.js";

export class RuneActorSheet extends ActorSheet {

  constructor(...args) {
    super(...args);
    // Estado local dos contadores (zera após rolagem)
    this._vantagens = 0;
    this._desvantagens = 0;
    this._bonus = 0;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rune-rpg", "sheet", "actor"],
      template: "systems/rune-rpg/templates/actor/character-sheet.hbs",
      width: 650,
      height: 750,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "principal" }],
      resizable: true
    });
  }

  getData() {
    const context = super.getData();
    context.system = this.actor.system;
    context.actor = this.actor;
    context.abordagens = [
      { key: "poder", label: "Poder" },
      { key: "astucia", label: "Astúcia" },
      { key: "visao", label: "Visão" }
    ];
    // Passa contadores para o template
    context.vantagens = this._vantagens;
    context.desvantagens = this._desvantagens;
    context.bonus = this._bonus;
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) return;

    // Rolagem de abordagem (instantânea)
    html.find(".roll-abordagem").click(ev => this._onRollAbordagem(ev));

    // Rolagem individual de dado
    html.find(".roll-individual").click(ev => this._onRollIndividual(ev));

    // Contadores
    html.find(".contador-vantagem").on("change", ev => {
      this._vantagens = Math.max(0, parseInt(ev.currentTarget.value) || 0);
      this.render(false);
    });
    html.find(".contador-desvantagem").on("change", ev => {
      this._desvantagens = Math.max(0, parseInt(ev.currentTarget.value) || 0);
      this.render(false);
    });
    html.find(".contador-bonus").on("change", ev => {
      this._bonus = Math.max(0, parseInt(ev.currentTarget.value) || 0);
      this.render(false);
    });

    // Botões +/- dos contadores
    html.find(".contador-btn").click(ev => {
      const btn = ev.currentTarget;
      const tipo = btn.dataset.tipo;
      const delta = btn.dataset.dir === "up" ? 1 : -1;
      if (tipo === "vantagem") this._vantagens = Math.max(0, this._vantagens + delta);
      if (tipo === "desvantagem") this._desvantagens = Math.max(0, this._desvantagens + delta);
      if (tipo === "bonus") this._bonus = Math.max(0, this._bonus + delta);
      this.render(false);
    });

    // Vigor
    html.find(".vigor-input").change(ev => this._onVigorChange(ev));

    // Itens
    html.find(".item-create").click(ev => this._onItemCreate(ev));
    html.find(".item-delete").click(ev => this._onItemDelete(ev));
    html.find(".item-edit").click(ev => this._onItemEdit(ev));
    html.find(".carga-input").change(ev => this._onCargaChange(ev));
  }

  // ─── Rolagens ───────────────────────────────────────────────

  async _onRollAbordagem(ev) {
    ev.preventDefault();
    const abordagemKey = ev.currentTarget.dataset.abordagem;
    const abordagemValor = this.actor.system.abordagens[abordagemKey];
    const label = `Rolagem de ${abordagemKey.charAt(0).toUpperCase() + abordagemKey.slice(1)}`;

    await RuneRollHandler.roll({
      abordagem: abordagemValor,
      vantagens: this._vantagens,
      desvantagens: this._desvantagens,
      bonus: this._bonus,
      actor: this.actor,
      label
    });

    // Zera contadores após rolagem
    this._vantagens = 0;
    this._desvantagens = 0;
    this._bonus = 0;
    this.render(false);
  }

  async _onRollIndividual(ev) {
    ev.preventDefault();
    const formula = ev.currentTarget.dataset.formula ?? "1d6";
    const label = ev.currentTarget.dataset.label ?? "Rolagem Individual";
    await RuneRollHandler.rollIndividual(formula, label);
  }

  // ─── Vigor ──────────────────────────────────────────────────

  async _onVigorChange(ev) {
    const field = ev.currentTarget.dataset.field;
    const value = parseInt(ev.currentTarget.value) || 0;
    await this.actor.update({ [`system.vigor.${field}`]: value });
  }

  // ─── Itens ──────────────────────────────────────────────────

  async _onItemCreate(ev) {
    ev.preventDefault();
    const tipo = ev.currentTarget.dataset.tipo ?? "equipamento";
    const itemData = { name: `Nova ${tipo}`, type: tipo };
    await Item.create(itemData, { parent: this.actor });
  }

  async _onItemDelete(ev) {
    ev.preventDefault();
    const itemId = ev.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) await item.delete();
  }

  async _onItemEdit(ev) {
    ev.preventDefault();
    const itemId = ev.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) item.sheet.render(true);
  }

  async _onCargaChange(ev) {
    const itemId = ev.currentTarget.closest(".item").dataset.itemId;
    const field = ev.currentTarget.dataset.field;
    const value = parseInt(ev.currentTarget.value) || 0;
    const item = this.actor.items.get(itemId);
    if (item) await item.update({ [`system.cargas.${field}`]: value });
  }
}
import { RuneRollHandler } from "../dice/roll-handler.js";

export class RuneActorSheet extends ActorSheet {

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
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
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) return;

    // Rolagem de abordagem
    html.find(".roll-abordagem").click(ev => this._onRollAbordagem(ev));

    // Rolagem individual de dado
    html.find(".roll-individual").click(ev => this._onRollIndividual(ev));

    // Rolagem livre (dialog)
    html.find(".roll-livre").click(ev => this._onRollLivre(ev));

    // Edição inline de vigor
    html.find(".vigor-input").change(ev => this._onVigorChange(ev));

    // Adicionar item
    html.find(".item-create").click(ev => this._onItemCreate(ev));

    // Deletar item
    html.find(".item-delete").click(ev => this._onItemDelete(ev));

    // Editar item
    html.find(".item-edit").click(ev => this._onItemEdit(ev));

    // Atualizar cargas de invenção
    html.find(".carga-input").change(ev => this._onCargaChange(ev));
  }

  // ─── Rolagens ───────────────────────────────────────────────

  async _onRollAbordagem(ev) {
    ev.preventDefault();
    const abordagemKey = ev.currentTarget.dataset.abordagem;
    const abordagemValor = this.actor.system.abordagens[abordagemKey];
    const label = `Rolagem de ${abordagemKey.charAt(0).toUpperCase() + abordagemKey.slice(1)}`;

    // Abre dialog para configurar a rolagem
    await this._dialogRolagem({ abordagem: abordagemValor, label });
  }

  async _onRollLivre(ev) {
    ev.preventDefault();
    await this._dialogRolagem({ abordagem: 0, label: "Rolagem Livre" });
  }

  async _onRollIndividual(ev) {
    ev.preventDefault();
    const formula = ev.currentTarget.dataset.formula ?? "1d6";
    const label = ev.currentTarget.dataset.label ?? "Rolagem Individual";
    await RuneRollHandler.rollIndividual(formula, label);
  }

  async _dialogRolagem({ abordagem, label }) {
    const content = `
      <form class="rune-dialog-roll">
        <div class="form-group">
          <label>Abordagem</label>
          <input type="number" name="abordagem" value="${abordagem}" min="0"/>
        </div>
        <div class="form-group">
          <label>Vantagens</label>
          <input type="number" name="vantagens" value="0" min="0"/>
        </div>
        <div class="form-group">
          <label>Desvantagens</label>
          <input type="number" name="desvantagens" value="0" min="0"/>
        </div>
        <div class="form-group">
          <label>Bônus (d4)</label>
          <input type="number" name="bonus" value="0" min="0"/>
        </div>
      </form>
    `;

    new Dialog({
      title: label,
      content,
      buttons: {
        rolar: {
          label: "Rolar",
          callback: async (html) => {
            const form = html.find("form")[0];
            const abordagemFinal = parseInt(form.abordagem.value) || 0;
            const vantagens = parseInt(form.vantagens.value) || 0;
            const desvantagens = parseInt(form.desvantagens.value) || 0;
            const bonus = parseInt(form.bonus.value) || 0;

            await RuneRollHandler.roll({
              abordagem: abordagemFinal,
              vantagens,
              desvantagens,
              bonus,
              actor: this.actor,
              label
            });
          }
        },
        cancelar: {
          label: "Cancelar"
        }
      },
      default: "rolar"
    }).render(true);
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
    const itemData = {
      name: `Nova ${tipo}`,
      type: tipo
    };
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
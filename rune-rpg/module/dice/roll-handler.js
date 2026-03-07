export class RuneRollHandler {

  /**
   * Rolagem principal do sistema RUNE
   * @param {object} options
   * @param {number} options.abordagem - Valor da abordagem usada
   * @param {number} options.vantagens - Quantidade de vantagens (antes de cancelar)
   * @param {number} options.desvantagens - Quantidade de desvantagens (antes de cancelar)
   * @param {number} options.bonus - Quantidade de dados bônus (+1d4 cada)
   * @param {Actor} options.actor - Ator que está rolando
   * @param {string} options.label - Rótulo da rolagem
   */
  static async roll({ abordagem = 0, vantagens = 0, desvantagens = 0, bonus = 0, actor = null, label = "Rolagem" } = {}) {

    // Calcula vantagem/desvantagem líquida
    const liquido = vantagens - desvantagens;
    const totalDados = 2 + Math.abs(liquido);
    const modo = liquido > 0 ? "vantagem" : liquido < 0 ? "desvantagem" : "normal";

    // Rola os dados base (2d6 + extras)
    const dadosBase = new Roll(`${totalDados}d6`);
    await dadosBase.evaluate();
    const resultadosBase = dadosBase.dice[0].results.map(r => r.result);

    // Seleciona os 2 dados relevantes
    const dadosOrdenados = [...resultadosBase].sort((a, b) => a - b);
    let dadosSelecionados;
    if (modo === "vantagem") {
      dadosSelecionados = dadosOrdenados.slice(-2); // 2 maiores
    } else if (modo === "desvantagem") {
      dadosSelecionados = dadosOrdenados.slice(0, 2); // 2 menores
    } else {
      dadosSelecionados = resultadosBase; // exatamente 2
    }

    const somaBase = dadosSelecionados[0] + dadosSelecionados[1];

    // Detecta Glória e Ruína (antes de adicionar abordagem)
    const gloria = dadosSelecionados[0] === 6 && dadosSelecionados[1] === 6;
    const ruina = dadosSelecionados[0] === 1 && dadosSelecionados[1] === 1;

    // Rola dados bônus (1d4 por bônus)
    let somaBonus = 0;
    const resultadosBonus = [];
    for (let i = 0; i < bonus; i++) {
      const dadoBonus = new Roll("1d4");
      await dadoBonus.evaluate();
      const valor = dadoBonus.dice[0].results[0].result;
      resultadosBonus.push(valor);
      somaBonus += valor;
    }

    // Total final
    const total = somaBase + abordagem + somaBonus;

    // Categoriza resultado
    const categoria = RuneRollHandler.categorizar(total, gloria, ruina);

    // Monta mensagem no chat
    await RuneRollHandler.enviarChat({
      label,
      modo,
      liquido: Math.abs(liquido),
      dadosSelecionados,
      resultadosBase,
      abordagem,
      resultadosBonus,
      somaBonus,
      total,
      categoria,
      gloria,
      ruina,
      actor
    });

    return { total, categoria, gloria, ruina, dadosSelecionados, resultadosBonus };
  }

  /**
   * Rolagem individual de um único dado
   * @param {string} formula - Ex: "1d6", "1d4"
   * @param {string} label
   */
  static async rollIndividual(formula, label = "Rolagem Individual") {
    const roll = new Roll(formula);
    await roll.evaluate();
    const resultado = roll.total;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker(),
      content: `
        <div class="rune-roll">
          <h3>${label}</h3>
          <p><strong>Dado:</strong> ${formula} → <strong>${resultado}</strong></p>
        </div>
      `
    });

    return resultado;
  }

  /**
   * Categoriza o resultado final
   */
  static categorizar(total, gloria, ruina) {
    if (ruina) return { nome: "Ruína", classe: "ruina" };
    if (gloria) return { nome: "Glória", classe: "gloria" };
    if (total <= 5) return { nome: "Desastre", classe: "desastre" };
    if (total <= 9) return { nome: "Complicação", classe: "complicacao" };
    return { nome: "Sucesso", classe: "sucesso" };
  }

  /**
   * Envia resultado formatado ao chat
   */
  static async enviarChat({ label, modo, liquido, dadosSelecionados, resultadosBase, abordagem, resultadosBonus, somaBonus, total, categoria, gloria, ruina, actor }) {

    const speaker = actor
      ? ChatMessage.getSpeaker({ actor })
      : ChatMessage.getSpeaker();

    // Monta linha de dados descartados (vantagem/desvantagem)
    let linhaExtras = "";
    if (modo !== "normal") {
      const descartados = resultadosBase.filter(v => !dadosSelecionados.includes(v) ||
        resultadosBase.indexOf(v) !== dadosSelecionados.indexOf(v));
      if (descartados.length > 0) {
        linhaExtras = `<p class="rune-descartados">Descartados: [${descartados.join(", ")}]</p>`;
      }
    }

    // Monta linha de bônus
    let linhaBonus = "";
    if (resultadosBonus.length > 0) {
      linhaBonus = `<p>Bônus (${resultadosBonus.length}d4): [${resultadosBonus.join(", ")}] = +${somaBonus}</p>`;
    }

    const modoLabel = modo === "vantagem"
      ? `Vantagem x${liquido}`
      : modo === "desvantagem"
      ? `Desvantagem x${liquido}`
      : "Normal";

    const content = `
      <div class="rune-roll rune-${categoria.classe}">
        <h3>${label}</h3>
        <p><strong>Modo:</strong> ${modoLabel}</p>
        <p><strong>Dados:</strong> [${dadosSelecionados.join(", ")}] + Abordagem ${abordagem}</p>
        ${linhaExtras}
        ${linhaBonus}
        <hr>
        <p class="rune-total"><strong>Total: ${total}</strong></p>
        <p class="rune-categoria rune-${categoria.classe}"><strong>${categoria.nome}</strong></p>
      </div>
    `;

    await ChatMessage.create({ speaker, content });
  }
}
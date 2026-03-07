export class RuneActor extends Actor {

  prepareData() {
    super.prepareData();
  }

  prepareDerivedData() {
    const system = this.system;

    // Garante que vigor nunca ultrapasse o máximo
    system.vigor.value = Math.clamped(system.vigor.value, 0, system.vigor.max);
  }
}
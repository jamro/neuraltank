export default class Memory {
  constructor() {
    this.resetAll()
  }

  rememberGameStep(gradients, reward) {
    this.pushGradients(this.gameGradients, gradients);
    this.gameRewards.push(reward);
  }

  aggregateGameResults() {
    this.pushGradients(this.allGradients, this.gameGradients);
    this.allRewards.push(this.gameRewards);
  }

  resetAll() {
    this.allGradients = [];
    this.allRewards = [];
    this.resetGame()
  }

  resetGame() {
    this.gameRewards = [];
    this.gameGradients = [];
  }

  pushGradients(record, gradients) {
    for (const key in gradients) {
      if (key in record) {
        record[key].push(gradients[key]);
      } else {
        record[key] = [gradients[key]];
      }
    }
  }
}


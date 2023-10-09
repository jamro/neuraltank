const stages = [
  {
    name: 'Static Scanning',
    envId: 'execution',
    epochSize: 10,
    episodeTimeLimit: 7000,
    learningRate: 0.0005,
    entropyCoefficient: 0.005,
    rewardWeights: [0, 1, 0, 0, 0],
    shooterEnabled: true,
    driverEnabled: true,
    shooterTrainable: true,
    driverTrainable: false
  },
  {
    name: 'Dynamic Scanning',
    envId: 'chase',
    epochSize: 30,
    episodeTimeLimit: 15000,
    learningRate: 0.0001,
    entropyCoefficient: 0.005,
    rewardWeights: [0, 1, 0, 0.1, 0],
    shooterEnabled: true,
    driverEnabled: true,
    shooterTrainable: true,
    driverTrainable: true
  }
]

export default stages
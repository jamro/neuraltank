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
  }
]

export default stages
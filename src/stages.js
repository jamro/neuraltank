const stages = [
  {
    stageId: 'scan1',
    stageName: 'Static Scanning',
    envId: 'execution',
    epochSize: 10,
    episodeTimeLimit: 7000,
    learningRate: 0.0005,
    entropyCoefficient: 0.005,
    rewardWeights: [0, 1, 0, 0, 0, 0],
    shooterEnabled: true,
    driverEnabled: true,
    shooterTrainable: true,
    driverTrainable: false
  },
  {
    stageId: 'follow1',
    stageName: 'Follow I',
    envId: 'chase',
    epochSize: 20,
    episodeTimeLimit: 10000,
    learningRate: 0.0005,
    entropyCoefficient: 0.005,
    rewardWeights: [0, 0, 0, 0, 0, 1],
    shooterEnabled: true,
    driverEnabled: true,
    shooterTrainable: false,
    driverTrainable: true
  },
  {
    stageId: 'follow2',
    stageName: 'Follow II',
    envId: 'chase',
    epochSize: 20,
    episodeTimeLimit: 20000,
    learningRate: 0.0005,
    entropyCoefficient: 0.005,
    rewardWeights: [0, 0, 0, 0.05, 0, 1],
    shooterEnabled: true,
    driverEnabled: true,
    shooterTrainable: false,
    driverTrainable: true
  },
  {
    stageId: 'scan2',
    stageName: 'Dynamic Scanning',
    envId: 'chase',
    epochSize: 30,
    episodeTimeLimit: 25000,
    learningRate: 0.00005,
    entropyCoefficient: 0.005,
    rewardWeights: [0, 1, 0, 0.1, 0, 0],
    shooterEnabled: true,
    driverEnabled: true,
    shooterTrainable: true,
    driverTrainable: true
  },
  {
    stageId: 'shoot1',
    stageName: 'Static Shooting',
    envId: 'execution',
    epochSize: 20,
    episodeTimeLimit: 7000,
    learningRate: 0.00002,
    entropyCoefficient: 0.005,
    rewardWeights: [1, 1, 0, 0.1, 1, 0],
    shooterEnabled: true,
    driverEnabled: true,
    shooterTrainable: true,
    driverTrainable: false
  },
  {
    stageId: 'shoot2',
    stageName: 'Dynamic Shooting',
    envId: 'chase',
    epochSize: 30,
    episodeTimeLimit: 15000,
    learningRate: 0.00002,
    entropyCoefficient: 0.005,
    rewardWeights: [1, 1, 0, 0.1, 1, 0],
    shooterEnabled: true,
    driverEnabled: true,
    shooterTrainable: true,
    driverTrainable: false
  },
]

export default stages
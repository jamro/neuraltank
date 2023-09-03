import * as tf from '@tensorflow/tfjs';
import ActorNetwork from './ActorNetwork.js';
import batchTensors from '../../utils/batchTensors.js';

const ENTROPY_COEFFICIENT = 0.001
const GAE_LAMBDA = 0.97
const PPO_CLIP_EPSILON = 0.2
const BATCH_SIZE = 128

export default class DualActorNetwork extends ActorNetwork {

  constructor(inputCount=1, outputCount=1, learningRate=0.001, name='actor') {
    super(inputCount, outputCount, learningRate, name + '-main')

    this.oldNet = new ActorNetwork(inputCount, outputCount, learningRate, name + '-old')

    this.refreshOldActor()
  }

  async save() {
    await super.save()
    await this.oldNet.save()
  }

  async remove() {
    await super.remove()
    await this.oldNet.remove()
  }

  async restore() {
    return (await super.restore()) && (await this.oldNet.restore())
  }

  refreshOldActor() {
    this.oldNet.net.setWeights(this.net.getWeights())
  }

  getAdvantages(rewardTensor, valueTensor, discountRate) {
    const lambda = GAE_LAMBDA
    const rewardArray = rewardTensor.squeeze().arraySync()
    const valueArray = valueTensor.squeeze().arraySync()
    const numSteps = rewardArray.length;
    let nextAdvantage = 0;
    const advantageArray = new Array(numSteps).fill(0);
    for (let t = numSteps - 1; t >= 0; t--) {
      let delta
      if(t === numSteps - 1) {
        delta = rewardArray[t] - valueArray[t]
      } else {
        delta = rewardArray[t] + discountRate * valueArray[t+1] - valueArray[t]
      }
      advantageArray[t] = delta + discountRate * lambda * nextAdvantage
      nextAdvantage = advantageArray[t]
    }
    const advantage = tf.tensor2d(advantageArray, [advantageArray.length, 1])
    return advantage
  }

  trainSingleBatch(input, action2, advantage) {
    const epsilon = PPO_CLIP_EPSILON
    const f = () => tf.tidy(() => {
      const [mean1, stdDev1, action1] = this.oldNet.exec(input)
      const [mean2, stdDev2, _] = this.exec(input)
      
      /*
        Action probability formula
        ============================================================

        variance = stddev^2
        exponent = -0.5 * (((action-mean)^2) / variance)
        coefficient = 1 / (stddev * 4 * PI()^2)
        prob = coefficient * EXP(exponent) 
      */
 
      const variance1 = tf.square(stdDev1)
      const exponent1 = tf.mul(-0.5, action1.sub(mean1).square().div(variance1))
      const coefficient1 = tf.div(1, stdDev1.mul(4*Math.PI*Math.PI))
      const prob1 = tf.tanh(coefficient1.mul(exponent1.exp()), 0, 1)
      const probProd1 = prob1.prod(1).expandDims(1) // calculate product of all probabilities in case of multidimensional action space

      const variance2 = tf.square(stdDev2)
      const exponent2 = tf.mul(-0.5, action2.sub(mean2).square().div(variance2))
      const coefficient2 = tf.div(1, stdDev2.mul(4*Math.PI*Math.PI))
      const prob2 = tf.tanh(coefficient2.mul(exponent2.exp()), 0, 1)
      const probProd2 = prob2.prod(1).expandDims(1) // calculate product of all probabilities in case of multidimensional action space

      const ratio = probProd2.div(probProd1)
      const surrogate1 = ratio.mul(advantage)
      const surrogate2 = tf.clipByValue(ratio, 1 - epsilon, 1 + epsilon).mul(advantage)

      const entropy = stdDev2.mean().square().mul(2*Math.PI*Math.E).log().mul(0.5)
      const loss = tf.neg(tf.minimum(surrogate1, surrogate2))
      const lossWithEntropy = loss.sub(entropy.mul(ENTROPY_COEFFICIENT))

      return lossWithEntropy.mean();
    })

    this.refreshOldActor()
    const cost = tf.tidy(() => this.optimizer.minimize(f, true))
    const actorLoss = cost.dataSync()[0]
    return actorLoss
  }

  async train(inputTensor, actionTensor, rewardTensor, valueTensor, discountRate) {
    const input = inputTensor.reshape([-1, inputTensor.shape[2]])
    const reward = rewardTensor.reshape([-1, rewardTensor.shape[2]])
    const value = valueTensor.reshape([-1, valueTensor.shape[2]])
    const action2 = actionTensor.reshape([-1, actionTensor.shape[2]])

    // calculate Generalized Advantage Estimation
    const advantage = this.getAdvantages(reward, value, discountRate)

    // shuffle and split into mini-batches
    const [
      inputBatch,
      action2Batch,
      advantageBatch,
    ] = batchTensors(BATCH_SIZE,  input, action2, advantage)

    let lossSum = 0
    let lossCount = 0
    for(let i=0; i < inputBatch.length;i ++) {
      this.notifyProgress(i/inputBatch.length)
      //await new Promise((done) => setTimeout(done, 5))
      const loss = this.trainSingleBatch(inputBatch[i], action2Batch[i], advantageBatch[i])
      lossSum += loss
      lossCount ++
    }
    this.notifyProgress(1)

    return lossSum / lossCount
  }

  notifyProgress(progress) {
    const event = new Event('progress')
    event.progress = progress
    this.dispatchEvent(event)
  }

}
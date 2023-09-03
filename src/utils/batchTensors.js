import * as tf from '@tensorflow/tfjs';


function shuffle(...arrays) {
  let currentIndex = arrays[0].length;
  let randomIndex, temporaryValue;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    for(let array of arrays) {
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  }

  return arrays;
}

function batchArray(batchSize, array) {
  const batches = [[]]

  const arrayLen = array.length

  for(let sourceIndex=0, batchIndex=0; sourceIndex < arrayLen; sourceIndex++) {
    if(batches[batchIndex].length >= batchSize) {
      batches.push([])
      batchIndex++
    }
    batches[batchIndex].push(array[sourceIndex])
  }
  return batches
}


export default function batchTensors(batchSize, ...inputTensors) {
  const inputArrays = inputTensors.map(t => t.arraySync())
  shuffle(...inputArrays)
  const arrayBatches = inputArrays.map(a => batchArray(batchSize, a))
  const tensorBatches = arrayBatches.map(b => b.map(a => tf.tensor2d(a)))

  return tensorBatches
}
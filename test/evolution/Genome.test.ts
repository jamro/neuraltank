import { expect } from 'chai';
import Genome from '../../src/evolution/Genome';

describe('test Genome', () => {

  it('should crossover genomes', () => {
    let ones:Uint8Array = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff]);
    let zeros:Uint8Array = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00]);

    let fullGenome: Genome = new Genome(ones.buffer);
    let emptyGenome: Genome = new Genome(zeros.buffer);
    let childMixedGenome: Genome = fullGenome.crossover(emptyGenome)
    let childFullGenome: Genome = fullGenome.crossover(fullGenome)
    let childEmptyGenome: Genome = emptyGenome.crossover(emptyGenome)

    zeros = new Uint8Array(emptyGenome.data);
    ones = new Uint8Array(fullGenome.data);
    let resultMixed:Uint8Array = new Uint8Array(childMixedGenome.data);
    let resultFull:Uint8Array = new Uint8Array(childFullGenome.data);
    let resultEmpty:Uint8Array = new Uint8Array(childEmptyGenome.data);

    expect(zeros).to.be.length(5);
    expect(zeros[0]).to.be.equal(0)
    expect(zeros[1]).to.be.equal(0)
    expect(zeros[2]).to.be.equal(0)
    expect(zeros[3]).to.be.equal(0)
    expect(zeros[4]).to.be.equal(0)

    expect(ones).to.be.length(5);
    expect(ones[0]).to.be.equal(0xff)
    expect(ones[1]).to.be.equal(0xff)
    expect(ones[2]).to.be.equal(0xff)
    expect(ones[3]).to.be.equal(0xff)
    expect(ones[4]).to.be.equal(0xff)

    expect(resultMixed).to.be.length(5);
    expect(resultMixed[0]).to.be.lessThan(0xff)
    expect(resultMixed[1]).to.be.lessThan(0xff)
    expect(resultMixed[2]).to.be.lessThan(0xff)
    expect(resultMixed[3]).to.be.lessThan(0xff)
    expect(resultMixed[4]).to.be.lessThan(0xff)

    expect(resultEmpty).to.be.length(5);
    expect(resultEmpty[0]).to.be.equal(0)
    expect(resultEmpty[1]).to.be.equal(0)
    expect(resultEmpty[2]).to.be.equal(0)
    expect(resultEmpty[3]).to.be.equal(0)
    expect(resultEmpty[4]).to.be.equal(0)

    expect(resultFull).to.be.length(5);
    expect(resultFull[0]).to.be.equal(0xff)
    expect(resultFull[1]).to.be.equal(0xff)
    expect(resultFull[2]).to.be.equal(0xff)
    expect(resultFull[3]).to.be.equal(0xff)
    expect(resultFull[4]).to.be.equal(0xff)
  });

  it('should mutate genomes', () => {
    let ones:Uint8Array = new Uint8Array([0xff]);
    let zeros:Uint8Array = new Uint8Array([0x00]);

    let fullGenome: Genome = new Genome(ones.buffer);
    let emptyGenome: Genome = new Genome(zeros.buffer);

    let childFullGenome:Genome = fullGenome.mutate();
    let childEmptyGenome:Genome = emptyGenome.mutate();

    let resultFull:Uint8Array = new Uint8Array(childFullGenome.data);
    let resultEmpty:Uint8Array = new Uint8Array(childEmptyGenome.data);

    expect(ones[0]).to.not.be.equal(resultFull[0]);
    expect(zeros[0]).to.not.be.equal(resultEmpty[0]);

  });

});

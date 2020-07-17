import { expect } from 'chai';
import Activation, {ActivationType} from '../../src/network/Activation';

describe('test Activation', () => {

  it('should process Linear activation', () => {
    let activation: Activation = new Activation(ActivationType.Linear);
    expect(activation.type).to.be.equal(ActivationType.Linear);
    expect(activation.process(0)).to.be.equal(0);
    expect(activation.process(0.12)).to.be.equal(0.12);
    expect(activation.process(-0.23)).to.be.equal(-0.23);
    expect(activation.process(-100.234)).to.be.equal(-100.234);
    expect(activation.process(9200.87)).to.be.equal(9200.87);
  });

  it('should process BinaryStep activation', () => {
    let activation: Activation = new Activation(ActivationType.BinaryStep);
    expect(activation.type).to.be.equal(ActivationType.BinaryStep);
    expect(activation.process(0)).to.be.equal(1);
    expect(activation.process(-0.001)).to.be.equal(0);
    expect(activation.process(0.001)).to.be.equal(1);
    expect(activation.process(0.12)).to.be.equal(1);
    expect(activation.process(-0.23)).to.be.equal(0);
    expect(activation.process(-100.234)).to.be.equal(0);
    expect(activation.process(9200.87)).to.be.equal(1);
  });

  it('should process Sigmoid activation', () => {
    let activation: Activation = new Activation(ActivationType.Sigmoid);
    expect(activation.type).to.be.equal(ActivationType.Sigmoid);
    expect(activation.process(0)).to.be.closeTo(0.5, 0.01);
    expect(activation.process(-0.3)).to.be.closeTo(0.42556, 0.01);
    expect(activation.process(0.7)).to.be.closeTo(0.66819, 0.01);
    expect(activation.process(100)).to.be.closeTo(1, 0.01);
    expect(activation.process(-200)).to.be.closeTo(0, 0.01);
    expect(activation.process(-10000)).to.be.closeTo(0, 0.01);
    expect(activation.process(20000)).to.be.closeTo(1, 0.01);
  });

  it('should process TanH activation', () => {
    let activation: Activation = new Activation(ActivationType.TanH);
    expect(activation.type).to.be.equal(ActivationType.TanH);
    expect(activation.process(0)).to.be.closeTo(0, 0.01);
    expect(activation.process(-0.3)).to.be.closeTo(-0.29131, 0.01);
    expect(activation.process(0.7)).to.be.closeTo(0.60437, 0.01);
    expect(activation.process(100)).to.be.closeTo(1, 0.01);
    expect(activation.process(-200)).to.be.closeTo(-1, 0.01);
    expect(activation.process(-10000)).to.be.closeTo(-1, 0.01);
    expect(activation.process(20000)).to.be.closeTo(1, 0.01);
  });

  it('should process ReLU activation', () => {
    let activation: Activation = new Activation(ActivationType.ReLU);
    expect(activation.type).to.be.equal(ActivationType.ReLU);
    expect(activation.process(0)).to.be.equal(0);
    expect(activation.process(0.12)).to.be.equal(0.12);
    expect(activation.process(0.9832)).to.be.equal(0.9832);
    expect(activation.process(5)).to.be.equal(5);
    expect(activation.process(-0.23)).to.be.equal(0);
    expect(activation.process(-100.234)).to.be.equal(0);
    expect(activation.process(-1090.234)).to.be.equal(0);
    expect(activation.process(9200.87)).to.be.equal(9200.87);
  });

  it('should process SoftPlus activation', () => {
    let activation: Activation = new Activation(ActivationType.SoftPlus);
    expect(activation.type).to.be.equal(ActivationType.SoftPlus);
    expect(activation.process(0)).to.be.closeTo(0.69315, 0.01);
    expect(activation.process(-0.3)).to.be.closeTo(0.55436, 0.01);
    expect(activation.process(0.7)).to.be.closeTo(1.10319, 0.01);
    expect(activation.process(100)).to.be.closeTo(100, 0.01);
    expect(activation.process(-200)).to.be.closeTo(0, 0.01);
    expect(activation.process(-10000)).to.be.closeTo(0, 0.01);
    expect(activation.process(20000)).to.be.closeTo(20000, 0.01);
  });

  it('should process LeakyReLU activation', () => {
    let activation: Activation = new Activation(ActivationType.LeakyReLU);
    expect(activation.type).to.be.equal(ActivationType.LeakyReLU);
    expect(activation.process(0)).to.be.closeTo(0, 0.01);
    expect(activation.process(0.12)).to.be.closeTo(0.12, 0.01);
    expect(activation.process(0.9832)).to.be.closeTo(0.9832, 0.01);
    expect(activation.process(5)).to.be.closeTo(5, 0.01);
    expect(activation.process(-0.23)).to.be.closeTo(-0.023, 0.01);
    expect(activation.process(-100.234)).to.be.closeTo(-10.0234, 0.01);
    expect(activation.process(-1090.234)).to.be.closeTo(-109.0234, 0.01);
    expect(activation.process(9200.87)).to.be.closeTo(9200.87, 0.01);
  });

  it('should process Softsign activation', () => {
    let activation: Activation = new Activation(ActivationType.Gaussian);
    expect(activation.type).to.be.equal(ActivationType.Gaussian);
    expect(activation.process(0)).to.be.closeTo(1, 0.01);
    expect(activation.process(-0.3)).to.be.closeTo(0.91393, 0.01);
    expect(activation.process(0.3)).to.be.closeTo(0.91393, 0.01);
    expect(activation.process(0.7)).to.be.closeTo(0.61263, 0.01);
    expect(activation.process(1)).to.be.closeTo(0.36788, 0.01);
    expect(activation.process(100)).to.be.closeTo(0, 0.01);
    expect(activation.process(-200)).to.be.closeTo(0, 0.01);
    expect(activation.process(-10000)).to.be.closeTo(0, 0.01);
    expect(activation.process(20000)).to.be.closeTo(0, 0.01);
  });


});

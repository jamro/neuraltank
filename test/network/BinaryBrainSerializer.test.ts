import { expect } from 'chai';
import BinaryBrainSerializer from '../../src/network/BinaryBrainSerializer';
import { BrainFieldType } from '../../src/network/BrainSerializer';

describe('test BrainSerializer', () => {

  it('should encode numeric values', () => {
    let serializer: BinaryBrainSerializer = new BinaryBrainSerializer();
    serializer.allocate(2);

    serializer.writeRaw(0x12345678, 0, 0, 0xffffffff);
    serializer.writeRaw(0xabcdef12, 1, 0, 0xffffffff);

    let raw: Uint8Array = new Uint8Array(serializer.serialize());

    expect(raw[3]).to.be.equal(0x12);
    expect(raw[2]).to.be.equal(0x34);
    expect(raw[1]).to.be.equal(0x56);
    expect(raw[0]).to.be.equal(0x78);

    expect(raw[7]).to.be.equal(0xab);
    expect(raw[6]).to.be.equal(0xcd);
    expect(raw[5]).to.be.equal(0xef);
    expect(raw[4]).to.be.equal(0x12);
  });

  it('should scale numeric values', () => {
    let serializer: BinaryBrainSerializer = new BinaryBrainSerializer();
    serializer.allocate(4);

    serializer.writeRaw(0.5, 0, 0, 1);
    serializer.writeRaw(13, 1, -100, 100);
    serializer.writeRaw(100, 2, -2, 2);
    serializer.writeRaw(100, 3, 200, 300);

    let raw: Uint32Array = new Uint32Array(serializer.serialize());

    expect(raw[0]).to.be.equal(0x80000000);
    expect(raw[1]).to.be.equal(0x90A3D70A);
    expect(raw[2]).to.be.equal(0xffffffff);
    expect(raw[3]).to.be.equal(0x00000000);

  });

  it('should readRaw numeric values', () => {
    let serializer: BinaryBrainSerializer = new BinaryBrainSerializer();
    serializer.allocate(4);

    serializer.writeRaw(0.123, 0, -1, 1);
    serializer.writeRaw(34.5, 1, 0, 100);
    serializer.writeRaw(-3, 2, -10, 0);
    serializer.writeRaw(1000000.123456, 3, 1000000, 1000001);

    expect(serializer.readRaw(0, -1, 1)).to.be.closeTo(0.123, 0.00001);
    expect(serializer.readRaw(1, 0, 100)).to.be.closeTo(34.5, 0.001);
    expect(serializer.readRaw(2, -10, 0)).to.be.closeTo(-3, 0.01);
    expect(serializer.readRaw(3, 1000000, 1000001)).to.be.closeTo(1000000.123456, 0.00000001);
  });

  it('should store ConnectionWeight type', () => {
    let serializer: BinaryBrainSerializer = new BinaryBrainSerializer();
    serializer.allocate(6);

    serializer.write(-4.1, 0, BrainFieldType.ConnectionWeight);
    serializer.write(-3.9, 1, BrainFieldType.ConnectionWeight);
    serializer.write(-3.123, 2, BrainFieldType.ConnectionWeight);
    serializer.write(0.19827, 3, BrainFieldType.ConnectionWeight);
    serializer.write(3.9, 4, BrainFieldType.ConnectionWeight);
    serializer.write(4.1, 5, BrainFieldType.ConnectionWeight);

    expect(serializer.read(0, BrainFieldType.ConnectionWeight)).to.be.closeTo(-4, 0.0001);
    expect(serializer.read(1, BrainFieldType.ConnectionWeight)).to.be.closeTo(-3.9, 0.0001);
    expect(serializer.read(2, BrainFieldType.ConnectionWeight)).to.be.closeTo(-3.123, 0.00001);
    expect(serializer.read(3, BrainFieldType.ConnectionWeight)).to.be.closeTo(0.19827, 0.0000001);
    expect(serializer.read(4, BrainFieldType.ConnectionWeight)).to.be.closeTo(3.9, 0.0001);
    expect(serializer.read(5, BrainFieldType.ConnectionWeight)).to.be.closeTo(4, 0.0001);

  });

  it('should store Bias type', () => {
    let serializer: BinaryBrainSerializer = new BinaryBrainSerializer();
    serializer.allocate(6);

    serializer.write(-1.1, 0, BrainFieldType.Bias);
    serializer.write(-0.9, 1, BrainFieldType.Bias);
    serializer.write(-0.123, 2, BrainFieldType.Bias);
    serializer.write(0.19827, 3, BrainFieldType.Bias);
    serializer.write(0.9, 4, BrainFieldType.Bias);
    serializer.write(1.1, 5, BrainFieldType.Bias);

    expect(serializer.read(0, BrainFieldType.Bias)).to.be.closeTo(-1, 0.0001);
    expect(serializer.read(1, BrainFieldType.Bias)).to.be.closeTo(-0.9, 0.0001);
    expect(serializer.read(2, BrainFieldType.Bias)).to.be.closeTo(-0.123, 0.00001);
    expect(serializer.read(3, BrainFieldType.Bias)).to.be.closeTo(0.19827, 0.0000001);
    expect(serializer.read(4, BrainFieldType.Bias)).to.be.closeTo(0.9, 0.0001);
    expect(serializer.read(5, BrainFieldType.Bias)).to.be.closeTo(1, 0.0001);
  });

  it('should store ActivationType type', () => {
    let serializer: BinaryBrainSerializer = new BinaryBrainSerializer();
    serializer.allocate(8);

    serializer.write(-1, 0, BrainFieldType.ActivationType);
    serializer.write(0, 1, BrainFieldType.ActivationType);
    serializer.write(0.9, 2, BrainFieldType.ActivationType);
    serializer.write(1, 3, BrainFieldType.ActivationType);
    serializer.write(1.1, 4, BrainFieldType.ActivationType);
    serializer.write(6, 5, BrainFieldType.ActivationType);
    serializer.write(7, 6, BrainFieldType.ActivationType);
    serializer.write(8, 7, BrainFieldType.ActivationType);

    expect(serializer.read(0, BrainFieldType.ActivationType)).to.be.equal(0);
    expect(serializer.read(1, BrainFieldType.ActivationType)).to.be.equal(0);
    expect(serializer.read(2, BrainFieldType.ActivationType)).to.be.equal(1);
    expect(serializer.read(3, BrainFieldType.ActivationType)).to.be.equal(1);
    expect(serializer.read(4, BrainFieldType.ActivationType)).to.be.equal(1);
    expect(serializer.read(5, BrainFieldType.ActivationType)).to.be.equal(6);
    expect(serializer.read(6, BrainFieldType.ActivationType)).to.be.equal(7);
    expect(serializer.read(7, BrainFieldType.ActivationType)).to.be.equal(7);
  });


  it('should serialize and deserialize', () => {
    let serializer1: BinaryBrainSerializer = new BinaryBrainSerializer();
    serializer1.allocate(3);
    serializer1.write(0.5443, 0, BrainFieldType.ConnectionWeight);
    serializer1.write(-0.9872, 1, BrainFieldType.Bias);
    serializer1.write(3, 2, BrainFieldType.ActivationType);

    let raw: ArrayBuffer = serializer1.serialize();

    let serializer2: BinaryBrainSerializer = new BinaryBrainSerializer();
    serializer2.deserialize(raw);

    expect(serializer2.read(0, BrainFieldType.ConnectionWeight)).to.be.closeTo(0.5443, 0.00001);
    expect(serializer2.read(1, BrainFieldType.Bias)).to.be.closeTo(-0.9872, 0.00001);
    expect(serializer2.read(2, BrainFieldType.ActivationType)).to.be.equal(3);
  });

});

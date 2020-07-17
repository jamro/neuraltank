import { expect } from 'chai';
import Connection from '../../src/network/Connection';

describe('test Connection', () => {

  it('should calculate output', () => {
    let connection:Connection = new Connection();
    connection.weight = 0.23;
    connection.input = 0.32;
    let output: number = connection.process();
    expect(output).to.equal(0.0736);
  });

});

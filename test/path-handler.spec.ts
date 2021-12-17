import 'reflect-metadata';
import { describe } from 'mocha';
import { ParseHandler } from '../src';

describe('path-handler.spec.ts', () => {
  it('should parseHandler generator', async function () {
    this.timeout(20000);
    const parseHandler = ParseHandler.create();
    await parseHandler.start();
    return Promise.resolve();
  });
});

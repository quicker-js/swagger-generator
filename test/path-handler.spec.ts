import 'reflect-metadata';
import { describe } from 'mocha';
import { ParseHandler } from '../src';

describe('path-handler.spec.ts', () => {
  it('should parseHandler generator', () => {
    const parseHandler = ParseHandler.create();
    void parseHandler.generator();
  });
});

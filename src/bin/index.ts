#!/usr/bin/env node

import 'reflect-metadata';
import { program } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { ParseHandler } from '../lib/parse-handler';
import { Config } from '../lib/config';

const PACKAGE = require(path.resolve('package.json'));

const VERSION = PACKAGE.version;

program.version(VERSION, '-v, --version');

program
  .command('generator')
  .allowUnknownOption(true)
  .description('生成接口文件')
  .action(async (a, b) => {
    if (typeof b === 'object' && Array.isArray(b.args)) {
      if (b.args.includes('--development')) {
        process.env.OAS_DEV_ENV = 'YES';
      }

      if (b.args.includes('--js')) {
        process.env.OAS_FILE_TYPE = 'js';
      }
    }

    const date = new Date();
    const parseHandler = ParseHandler.create();
    await parseHandler.start();
    console.log('\n======================================');
    console.log(
      chalk.green(`总共耗时 | ${new Date().getTime() - date.getTime()}ms`)
    );
    console.log(chalk.green(`总文件数 | ${parseHandler.fileCount}`));
    console.log('======================================');
  });

program
  .command('init')
  .description('生成配置文件')
  .action(() => {
    const filePath = path.resolve('swagger-generator.config.js');
    fs.writeFileSync(
      filePath,
      `module.export = ${JSON.stringify(new Config(), null, 2)}`
    );
    console.log(chalk.green(`创建成功 ${filePath}`));
  });

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.outputHelp((cb) => {
    return chalk.green(cb);
  });
}

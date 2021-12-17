/**
 * MIT License
 * Copyright (c) 2021 YunlongRan<549510622@qq.com> @quicker-js/swagger-generator
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ts from 'typescript';
import inquirer from 'inquirer';

/**
 * @class ParserUtil
 */
export class ParserUtil {
  /**
   * 是否包含
   * @param input
   */
  public static hasGenericParameter(input: string): boolean {
    return /</.test(input) && />$/.test(input);
  }

  /**
   * 获取泛型参数
   * @param input
   */
  public static getGenericParameter(input: string): string {
    return input
      .replace(/^[A-z_$][A-z_0-9$]+(«|<)?/, '')
      .replace(/(»|>)$/, '')
      .replace(/«/g, '<')
      .replace(/»/g, '>');
  }

  /**
   * 去除泛型参数
   * @param input
   */
  public static removeGenericParameter(input: string): string {
    return input.split('<')[0];
  }

  /**
   * 获取所有的泛型参数
   * @param input
   */
  public static getGenericParameters(input: string): string[] {
    const list: string[] = [];
    while (ParserUtil.hasGenericParameter(input)) {
      input = ParserUtil.getGenericParameter(input);
      list.push(input);
    }
    return list;
  }

  /**
   * 获取queryString中的Array参数
   * @param input
   */
  public static getArrayParameters(input: string): {
    name: string;
    child: string;
  } {
    const [name, child] = input.replace(/\[[0-9]+?\]\./, ' ').split(/\s/);
    return {
      name: name,
      child: child,
    };
  }

  /**
   * unicode转汉字
   * @param input
   * @private
   */
  public static unescape(input: string): string {
    const regexp = /\\u[\w\d]{4}/g;
    let str = input,
      exec: RegExpExecArray | null = null;
    do {
      exec = regexp.exec(input);
      if (exec) {
        str = str.replace(exec[0], unescape(exec[0].replace('\\u', '%u')));
      }
    } while (exec);
    return str;
  }

  /**
   * 创建文件夹
   * @param fileName
   * @private
   */
  private static createDir(fileName: string): void {
    let pathName = path.dirname(fileName);
    const dirs: string[] = [];
    while (pathName && !fs.existsSync(pathName)) {
      dirs.push(pathName);
      pathName = path.dirname(pathName);
    }
    dirs.reverse().forEach((o) => {
      fs.mkdirSync(o);
    });
  }

  public static overwrite = 1;

  /**
   * 生成文件
   * @param fileName
   * @param file
   */
  public static async write(fileName: string, file: string): Promise<void> {
    try {
      if (
        (ParserUtil.overwrite === 0 ||
          ParserUtil.overwrite === 1 ||
          ParserUtil.overwrite === 3) &&
        fs.existsSync(fileName)
      ) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'rawlist',
            message: '当前文件已存在，是否覆盖文件，输入数字继续',
            name: 'overwrite',
            choices: [
              {
                key: 1,
                name: '覆盖当前',
                value: 1,
              },
              {
                key: 2,
                name: '覆盖所有',
                value: 2,
              },
              {
                key: 3,
                name: '跳过当前',
                value: 3,
              },
              {
                key: 4,
                name: '跳过所有',
                value: 4,
              },
            ],
          },
        ]);
        ParserUtil.overwrite = overwrite;
      }

      if (ParserUtil.overwrite === 1 || ParserUtil.overwrite === 2) {
        ParserUtil.createDir(fileName);
        if (process.env.OAS_FILE_TYPE) {
          fileName = fileName.replace(/\.ts$/, '.js');
          const readConfigFile = ts.readConfigFile(
            path.resolve('tsconfig.json'),
            ts.sys.readFile
          );

          fs.writeFileSync(
            fileName,
            ts.transpile(file, {
              ...readConfigFile.config.compilerOptions,
              noEmit: true,
              declaration: true,
              removeComments: false,
              moduleResolution: 'classic',
            })
          );
        } else {
          fs.writeFileSync(fileName, file);
        }
        console.log(
          chalk.green('WriteFileSuccess'),
          ': ',
          chalk.gray(fileName)
        );
      } else {
        console.log(
          chalk.yellow('WriteFileSkip' + ''),
          ': ',
          chalk.gray(fileName)
        );
      }
    } catch (e) {
      console.log(chalk.red('WriteFileError'), ': ', chalk.gray(fileName));
    }
  }
}

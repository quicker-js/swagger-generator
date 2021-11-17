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
import { Config } from '../config';
import classTransformer from '@quicker-js/class-transformer';
import { NamespaceManager } from '../namespace-manager';
import { FileManager } from '../file-manager';
import { createPrinter, NewLineKind } from 'typescript';

/**
 * @class ParseHandler
 */
export class ParseHandler {
  /**
   * 构造函数
   * @param config
   */
  public constructor(public config: Config) {
    // 加载资源文件
    this.loadAssets();
  }

  /**
   * 命名空间管理器
   * @private
   */
  private namespaceManager = new NamespaceManager(this);

  /**
   * 加载资源
   */
  public loadAssets(): void {
    const { config, namespaceManager } = this;
    const { namespaces } = config;
    namespaces.forEach((assetPath, namespace) => {
      this.namespaceManager.set(
        namespace,
        FileManager.create({
          assetPath,
          namespaceManager,
          namespace,
        })
      );
    });
  }

  /**
   * 统一标准文件名称处理
   */
  public fileNameParser(name: string): string {
    return ParseHandler.nameParser(name, this.config.caseType);
  }

  /**
   * 文件总数量
   */
  public get fileCount(): number {
    let i = 0;
    for (const fileManager of this.namespaceManager.values()) {
      i += fileManager.paths.size;
      i += fileManager.definitions.size;
    }
    return i;
  }

  /**
   * 生成文件
   */
  public async generator(): Promise<void> {
    for (const fileManager of this.namespaceManager.values()) {
      await fileManager.parse();
    }
  }

  /**
   * 获取配置
   */
  public static getConfig(): Config {
    if (fs.existsSync(path.resolve('swagger-generator.config.js'))) {
      return classTransformer.plainToInstance(
        Config,
        require(path.resolve('swagger-generator.config.js'))
      );
    }
    return new Config();
  }

  /**
   * 工厂函数
   * 创建一个ParseHandler
   */
  public static create(): ParseHandler {
    return new ParseHandler(ParseHandler.getConfig());
  }

  /**
   * 名称处理
   * @param name
   * @param type
   */
  public static nameParser(
    name: string,
    type: 'camelCase' | 'kebabCase'
  ): string {
    const strings = name
      .replace(/{/, 'By ')
      .split(ParseHandler.nameRegexp)
      .filter((s) => s && !ParseHandler.nameRegexp.test(s))
      .map((s) => {
        const list: string[] = [];
        const regexp = /[A-Z]?[a-z0-9]+/g;
        let match: RegExpExecArray | null = null;
        do {
          match = regexp.exec(s);
          if (match) {
            list.push(match[0]);
          }
        } while (match);

        return list
          .map((i) => {
            if (type === 'kebabCase') {
              return i.toLowerCase();
            } else {
              return i.charAt(0).toUpperCase() + i.substr(1);
            }
          })
          .join(type === 'kebabCase' ? '-' : '');
      });
    return strings.join(type === 'kebabCase' ? '-' : '');
  }

  /**
   * 命名分割规则
   * @private
   */
  private static nameRegexp = /(}|\/|«|»|{|\s)/;

  /**
   * typescript printer
   */
  public static printer = createPrinter({
    removeComments: false,
    newLine: NewLineKind.LineFeed,
  });
}

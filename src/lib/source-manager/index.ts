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

import path from 'path';

import { ParseHandler } from '../parse-handler';
import { Source } from '../source';
import { AstFile } from '../ast-file';
import { ParserUtil } from '../utils';

/**
 * 资源文件管理器
 */
export class SourceManager implements SourceManagerImpl {
  /**
   * 构造函数
   * @param namespaces 命名空间列表
   * @param handler 解析处理器
   */
  private constructor(
    public readonly namespaces: Map<string, string>,
    public readonly handler: ParseHandler
  ) {
    namespaces.forEach((assetPath, namespace) => {
      this.originSource.set(
        namespace,
        Source.create({
          assetPath,
          namespace,
          sourceManager: this,
        })
      );
    });
  }

  /**
   * 原始资源文件
   * Map<namespace, Source>
   */
  public originSource: Map<string, Source> = new Map();

  /**
   * 文件列表
   * Map<filePath, Source>
   */
  public files: Map<string, AstFile> = new Map();

  /**
   * 文件分组
   *  Map<DirPath, Map<fileName, SourceFile>>
   */
  public filesGroup: Map<string, Map<string, AstFile>> = new Map();

  /**
   * 解析
   * 此阶段 加载完所有文件 解析出所有文件 并且group文件
   * this.files 组装完成
   * this.filesGroup 组装完成
   */
  public async parse(): Promise<void> {
    const sources = this.originSource.values();
    for (const source of sources) {
      await source.parse();
    }

    // 根据文件的文件夹路径group
    this.files.forEach((sourceFile, filePath) => {
      const s = path.dirname(filePath);
      const sourceFiles = this.filesGroup.get(s) || new Map<string, AstFile>();
      sourceFiles.set(sourceFile.fileName, sourceFile);
      this.filesGroup.set(s, sourceFiles);
    });
  }

  /**
   * 创建的基础信息
   */
  public create(): void {
    this.files.forEach((sourceFile) => sourceFile.create());
  }

  /**
   * 生成
   */
  public async generator(): Promise<void> {
    for (const file of this.files.values()) {
      await file.generator();
    }

    const files: Array<{ filePath: string; file: string }> = [];
    // 生成index文件
    this.filesGroup.forEach((group, filePath) => {
      files.push({
        filePath,
        file: Array.from(group.values())
          .map((o) => {
            return `export * from "./${o.filePath}";`;
          })
          .join('\n'),
      });
    });

    for (const file of files) {
      await ParserUtil.write(path.join(file.filePath, 'index.ts'), file.file);
    }
  }

  /**
   * 创建 SourceManager
   * @param option
   */
  public static create(option: SourceManagerImpl): SourceManager {
    return new SourceManager(option.namespaces, option.handler);
  }
}

export interface SourceManagerImpl {
  readonly namespaces: Map<string, string>;
  readonly handler: ParseHandler;
}

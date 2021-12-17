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

import { SwaggerPathMethod } from '../swagger';
import { Source } from '../source';
import { SourceFile, SourceFileImpl } from '../source-file';
import { PathReplacer } from '../config';
import { ParseHandler } from '../parse-handler';
import path from 'path';
import { SourceFileProperty } from '../source-file-property';

/**
 * @class PathFile
 */
export class PathSourceFile extends SourceFile implements PathSourceFileImpl {
  /**
   * constructor
   * @param source Source
   * @param fileName 文件名称
   * @param filePath 文件路径
   * @param pathMethod path参数
   * @param url url
   * @param method 方法
   * @param isGlobal 是否为全局文件
   * @private
   */
  private constructor(
    public readonly source: Source,
    public readonly fileName: string,
    public readonly filePath: string,
    public readonly pathMethod: SwaggerPathMethod | undefined,
    public readonly url: string | undefined,
    public readonly method: 'post' | 'put' | 'delete' | 'get' | undefined,
    public readonly isGlobal: boolean = false
  ) {
    super(source, fileName, filePath);
  }

  /**
   * 资源绝对路径
   */
  public get absolute(): string {
    const { isGlobal, source, method, filePath } = this;
    if (method) {
      return path.join(
        isGlobal ? source.rootPath : source.path,
        'dtos',
        method,
        filePath + '.ts'
      );
    }
    return path.join(
      isGlobal ? source.rootPath : source.path,
      'dtos',
      filePath + '.ts'
    );
  }

  /**
   * 原始路径
   */
  public get originAbsolutePath(): string {
    const { source } = this;
    return path.join(source.path, 'dtos');
  }

  /**
   * 获取成员列表
   * @protected
   */
  public getProperties(): SourceFileProperty[] {
    const { pathMethod } = this;
    if (!pathMethod) {
      return [];
    }

    return pathMethod.getNoSubParameters().map((property) =>
      SourceFileProperty.create({
        sourceFile: this,
        name: property.name,
        property,
      })
    );
  }

  /**
   * 获取描述
   * @protected
   */
  public getDescription(): string | undefined {
    return this.pathMethod && this.pathMethod.getDescription();
  }

  /**
   * 创建 SourceFile 实例
   * @param option
   */
  public static create(option: PathSourceFileImpl): PathSourceFile {
    return new PathSourceFile(
      option.source,
      option.fileName,
      option.filePath,
      option.pathMethod,
      option.url,
      option.method,
      option.isGlobal
    );
  }

  /**
   * 通过资源创建
   * @param source
   * @param pathMethod
   * @param urlName
   * @param method
   * @param url
   */
  public static from(
    source: Source,
    pathMethod: SwaggerPathMethod,
    urlName: string,
    method: 'post' | 'put' | 'delete' | 'get',
    url: string
  ): PathSourceFile {
    let name = urlName;
    const { handler } = source.sourceManager;
    const { replaces, globalFiles } = handler.config;
    // 替换path
    replaces.map((o) => {
      if (o instanceof PathReplacer && typeof o.value === 'string') {
        name = name.replace(o.test, o.value);
      }
    });

    const fileName = ParseHandler.nameParser(name, 'camelCase');

    const isGlobal = !!globalFiles.find((o) => o.test(fileName));

    return PathSourceFile.create({
      source,
      fileName: ParseHandler.nameParser(name, 'camelCase'),
      filePath: handler.fileNameParser(name),
      method,
      pathMethod,
      isGlobal,
      url: /^\//.test(url) ? url : undefined,
    });
  }
}

export interface PathSourceFileImpl extends SourceFileImpl {
  readonly pathMethod: SwaggerPathMethod | undefined;
  readonly url: string | undefined;
  readonly method: 'post' | 'put' | 'delete' | 'get' | undefined;
}

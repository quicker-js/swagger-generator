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

import { Source } from '../source';
import { ParserUtil } from '../utils';
import { NameReplacer } from '../config';
import { SwaggerDefinition } from '../swagger';
import { ParseHandler } from '../parse-handler';
import { SourceFile, SourceFileImpl } from '../source-file';
import { SourceFileProperty } from '../source-file-property';

/**
 * 模型文件
 */
export class ModelSourceFile extends SourceFile implements ModelSourceFileImpl {
  /**
   * constructor
   * @param source 所属source
   * @param fileName 文件名称
   * @param filePath 文件路径
   * @param originGenerics 范型参数
   * @param definition SwaggerDefinition
   * @param isGlobal 是否为全局文件
   * @private
   */
  private constructor(
    public readonly source: Source,
    public readonly fileName: string,
    public readonly filePath: string,
    public readonly originGenerics: Set<string>,
    public readonly definition: SwaggerDefinition | undefined,
    public readonly isGlobal: boolean = false
  ) {
    super(source, fileName, filePath, isGlobal);
  }

  /**
   * 绝对路径
   */
  public get absolute(): string {
    const { isGlobal, source, filePath } = this;
    const { handler } = source.sourceManager;
    return path.join(
      isGlobal ? source.rootPath : source.path,
      'vos',
      handler.fileNameParser(filePath) + '.ts'
    );
  }

  /**
   * 原始路径
   */
  public get originAbsolutePath(): string {
    const { source } = this;
    return path.join(source.path, 'vos');
  }

  /**
   * 获取成员列表
   */
  public getProperties(): SourceFileProperty[] {
    const { definition } = this;
    const list: SourceFileProperty[] = [];
    if (definition) {
      definition.properties.forEach((property, name) => {
        list.push(
          SourceFileProperty.create({
            property,
            name,
            sourceFile: this,
          })
        );
      });
    }
    return list;
  }

  /**
   * 获取描述文字
   * @protected
   */
  public getDescription(): string | undefined {
    return this.definition && this.definition.title;
  }

  /**
   * 创建 SourceFile 实例
   * @param option ModelSourceFileImpl
   */
  public static create(option: ModelSourceFileImpl): ModelSourceFile {
    return new ModelSourceFile(
      option.source,
      option.fileName,
      option.filePath,
      option.originGenerics,
      option.definition,
      option.isGlobal
    );
  }

  /**
   * 通过 source 创建
   * @param source Source对象
   * @param definition SwaggerDefinition对象
   * @param name 名称
   */
  public static from(
    source: Source,
    definition: SwaggerDefinition,
    name: string
  ): ModelSourceFile {
    const { handler } = source.sourceManager;
    const { replaces, globalFiles } = handler.config;
    const generics = new Set<string>();
    let genericParameter = ParserUtil.getGenericParameter(name);

    if (genericParameter) {
      replaces.forEach((o) => {
        if (o.value && o.type === 'name') {
          genericParameter = genericParameter.replace(o.test, o.value);
        }
      });
      generics.add(genericParameter);
    }

    let fileName = ParseHandler.nameParser(name.split('«')[0], 'camelCase');

    const isGlobal = !!globalFiles.find((o) => o.test(fileName));

    // 替换path
    replaces.map((o) => {
      if (o instanceof NameReplacer && typeof o.value === 'string') {
        fileName = fileName.replace(o.test, o.value);
      }
    });

    return ModelSourceFile.create({
      source,
      originGenerics: generics,
      fileName,
      filePath: handler.fileNameParser(fileName.split('«')[0]),
      isGlobal,
      definition,
    });
  }
}

export interface ModelSourceFileImpl extends SourceFileImpl {
  readonly originGenerics: Set<string>;
  readonly definition: SwaggerDefinition | undefined;
}

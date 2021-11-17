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

import { SwaggerFile } from '../swagger/swagger-file';
import { SwaggerDefinitionProperty } from '../swagger';
import { ParserUtil } from '../utils';

/**
 * @class Dependency
 */
export class Dependency implements DependencyImpl {
  /**
   *  constructor
   * @param name 依赖名称
   * @param swaggerFile
   * @param definitionProperty
   * @param generics
   */
  public constructor(
    public name: string,
    public swaggerFile: SwaggerFile,
    public definitionProperty: SwaggerDefinitionProperty | undefined,
    public generics: string[]
  ) {}

  /**
   * 判断是否为数组类型
   */
  public isArray(): boolean {
    return (
      this.definitionProperty !== undefined &&
      this.definitionProperty.type === 'array'
    );
  }

  /**
   * 判断是否为泛型参数
   */
  public isGenericParameter(): boolean {
    return (
      this.generics.length > 0 &&
      this.generics.every(
        (gc) =>
          gc === this.name ||
          ParserUtil.getGenericParameters(gc).includes(this.name)
      )
    );
  }

  /**
   * 创建Dependency实例
   * @param option
   */
  public static create(option: DependencyImpl): Dependency {
    return new Dependency(
      option.name,
      option.swaggerFile,
      option.definitionProperty,
      option.generics
    );
  }
}

export interface DependencyImpl {
  name: string;
  swaggerFile: SwaggerFile;
  definitionProperty: SwaggerDefinitionProperty | undefined;
  generics: string[];
}

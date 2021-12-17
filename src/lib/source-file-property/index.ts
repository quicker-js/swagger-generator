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

import { SourceFile } from '../source-file';
import {
  SwaggerDefinitionProperty,
  SwaggerPathMethodParameter,
} from '../swagger';
import { ModelSourceFile } from '../model-source-file';
import { NameReplacer } from '../config';

/**
 * @class SourceFileProperty
 */
export class SourceFileProperty implements SourceFilePropertyImpl {
  /**
   * constructor
   * @param sourceFile 所属文件
   * @param name 名称
   * @param property SwaggerDefinitionProperty
   * @private
   */
  private constructor(
    public readonly sourceFile: SourceFile,
    public readonly name: string,
    public readonly property:
      | SwaggerDefinitionProperty
      | SwaggerPathMethodParameter
  ) {}

  /**
   * 数据类型
   */
  public get type(): string | undefined {
    const { property } = this;
    if (property instanceof SwaggerDefinitionProperty) {
      return property.type;
    } else {
      return property.getType();
    }
  }

  /**
   * 获取描述
   */
  public get description(): string | undefined {
    const { property } = this;
    if (property instanceof SwaggerDefinitionProperty) {
      return property.description;
    } else {
      return property.description;
    }
  }

  /**
   * 获取格式
   */
  public get format(): string | undefined {
    const { property } = this;
    if (property instanceof SwaggerDefinitionProperty) {
      return property.format;
    } else {
      return property.getFormat();
    }
  }

  /**
   * 获取in
   */
  public get in(): string | undefined {
    const { property } = this;
    if (property instanceof SwaggerPathMethodParameter) {
      return property.in;
    }
  }

  /**
   * 是否required
   */
  public get required(): boolean | undefined {
    const { property } = this;
    if (property instanceof SwaggerPathMethodParameter) {
      return property.required;
    }
  }

  /**
   * 外部依赖
   */
  public get ref(): string | undefined {
    const { property, sourceFile } = this;
    const { replaces } = sourceFile.source.sourceManager.handler.config;
    if (property instanceof SwaggerDefinitionProperty) {
      let name = property.getRef();
      replaces.forEach((o) => {
        if (o instanceof NameReplacer && o.value) {
          name = name.replace(o.test, o.value);
        }
      });
      return name;
    }
  }

  /**
   * 检测当前成员是否为泛型参数
   */
  public isGeneric(): boolean {
    const { sourceFile, ref } = this;
    if (sourceFile instanceof ModelSourceFile && ref) {
      return Array.from(sourceFile.originGenerics).some(
        (generic) => generic === ref || new RegExp(`<${ref}>`).test(generic)
      );
    }
    return false;
  }

  /**
   * 创建成员
   * @param option
   */
  public static create(option: SourceFilePropertyImpl): SourceFileProperty {
    return new SourceFileProperty(
      option.sourceFile,
      option.name,
      option.property
    );
  }
}

export interface SourceFilePropertyImpl {
  readonly sourceFile: SourceFile;
  readonly name: string;
  readonly property: SwaggerDefinitionProperty | SwaggerPathMethodParameter;
}

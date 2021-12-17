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

import { Prop, SubType } from '@quicker-js/class-transformer';
import path from 'path';
import { MomentReplacer } from './moment-replacer';
import { PathReplacer } from './path-replacer';
import { NameReplacer } from './name-replacer';

/**
 * 配置文件
 */
export class Config {
  /**
   * 命名空间
   */
  @Prop({
    type: String,
  })
  public readonly namespaces: Map<string, string> = new Map();

  /**
   * api输出目录
   */
  @Prop.default
  public readonly output: string = path.resolve('src', 'apis');

  /**
   * 文件名称的命名方式 有camelCase命名方式和kebabCase命名方法
   * 默认kebabCase
   */
  @Prop.default
  public readonly caseType: 'camelCase' | 'kebabCase' = 'kebabCase';

  /**
   * 最大文件数量
   */
  @Prop.default
  public readonly fileMax = 10000;

  /**
   * 是否允许生成泛型约束
   */
  @Prop.default
  public readonly allowTypeParameterDeclarations = false;

  /**
   * 需要安装moment库
   * 是否允许用moment替换Date类型
   */
  @Prop.default
  public readonly moment: MomentReplacer = new MomentReplacer();

  /**
   * 全局文件
   */
  @Prop({
    type: RegExp,
  })
  public readonly globalFiles: RegExp[] = [];

  /**
   * 替换规则
   */
  @Prop({
    subTypes: SubType.fromTypes(NameReplacer, PathReplacer),
  })
  public readonly replaces: NameReplacer[] | PathReplacer[] = [];

  /**
   * 过滤文件
   */
  @Prop({
    type: RegExp,
  })
  public readonly excludes: RegExp[] = [];

  /**
   * 生成的文档版本
   * 版本号
   */
  @Prop.default
  public readonly version?: string = '0.0.1';
}

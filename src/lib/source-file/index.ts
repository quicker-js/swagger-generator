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

import { Source } from '../source';
import { SourceFileProperty } from '../source-file-property';

/**
 * 资源文件
 * @class SourceFile
 */
export abstract class SourceFile implements SourceFileImpl {
  /**
   * 构造函数
   * @param source 资源对象
   * @param fileName 文件名称
   * @param filePath 文件路径
   * @param isGlobal 是否为全局文件
   */
  protected constructor(
    public source: Source,
    public fileName: string,
    public filePath: string,
    public readonly isGlobal: boolean = false
  ) {}

  /**
   * 获取描述
   * @public
   */
  public abstract getDescription(): string | undefined;

  /**
   * 获取成员列表
   * @protected
   */
  public abstract getProperties(): SourceFileProperty[];

  /**
   * 资源绝对路径
   */
  public abstract absolute: string;

  /**
   * 原始绝对路径 便于global文件查找资源
   */
  public abstract originAbsolutePath: string;
}

export interface SourceFileImpl {
  readonly isGlobal?: boolean;
  source: Source;
  fileName: string;
  filePath: string;
}

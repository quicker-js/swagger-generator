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

import {
  Entity,
  Typed,
  TypedArray,
  TypedMap,
} from '@quicker-js/class-transformer';
import { SwaggerApiInfo } from '../swagger-api-info';
import { SwaggerApiServer } from '../swagger-api-server';
import { SwaggerApiTag } from '../swagger-api-tag';
import { SwaggerComponents } from '../swagger-components';
import { SwaggerPath } from '../swagger-path';
import { SwaggerDefinition } from '../swagger-definition';

@Entity({
  title: '',
  description: '',
})
/**
 * @class SwaggerApi
 */
export class SwaggerApi {
  /**
   * open api版本
   */
  @Typed()
  public openapi: string;

  /**
   * open api版本
   * only 2.0
   */
  @Typed()
  public swagger: string;

  /**
   * 文档信息
   */
  @Typed()
  public info: SwaggerApiInfo;

  /**
   * 服务端地址
   */
  @TypedArray(SwaggerApiServer)
  public servers: SwaggerApiServer[];

  /**
   * tags
   */
  @TypedArray(SwaggerApiTag)
  public tags: SwaggerApiTag[];

  /**
   * host
   * only 2.0
   */
  @Typed()
  public host?: string;

  /**
   * 基础路径
   * only 2.0
   */
  @Typed()
  public basePath: string;

  /**
   * Model集合
   * only 2.0
   */
  @TypedMap(SwaggerDefinition)
  private definitions: Map<string, SwaggerDefinition>;

  /**
   * path集合
   */
  @TypedMap(SwaggerPath)
  public paths: Map<string, SwaggerPath>;

  /**
   * Model集合
   * only 3.0
   */
  @Typed(SwaggerComponents)
  private components: SwaggerComponents;

  /**
   * 获取 SwaggerDefinition 集合
   */
  public get swaggerDefinitions(): Map<string, SwaggerDefinition> {
    if (this.definitions) {
      return this.definitions;
    } else if (this.components) {
      return this.components.schemas;
    }
    return new Map<string, SwaggerDefinition>();
  }
}

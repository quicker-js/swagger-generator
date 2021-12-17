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

import { Prop } from '@quicker-js/class-transformer';
import { SwaggerPathMethodResponseInfoSchema } from '../swagger-path-method-response-info-schema';

/**
 * @class SwaggerDefinitionProperty
 */
export class SwaggerDefinitionProperty {
  /**
   * prop的类型
   */
  @Prop.default
  public type: string;

  /**
   * prop的类格式
   */
  @Prop.default
  public format: string;

  /**
   * 类型 ref
   * Support only 3.0
   */
  @Prop.default
  public $ref?: string;

  /**
   * Support only <= 2.0
   */
  @Prop.default
  public items?: SwaggerPathMethodResponseInfoSchema;

  /**
   * ref
   */
  private get ref(): string {
    if (this.$ref) {
      return this.$ref;
    }

    if (this.items) {
      if (this.items.originalRef) {
        return this.items.originalRef;
      }
      if (this.items.$ref) {
        return this.items.$ref;
      }
      // if (this.items.type && this.items.items) {
      //   return this.items.items.type;
      // }
    }
    return '';
  }

  /**
   * 获取ref
   */
  public getRef(): string {
    return this.ref
      .replace('#/definitions/', '')
      .replace('#/components/schemas/', '')
      .replace(/«/g, '<')
      .replace(/»/g, '>');
  }

  /**
   * 描述
   */
  @Prop.default
  public description: string;

  /**
   * 枚举值
   */
  @Prop({
    type: String,
  })
  public enum: string[];
}

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

import { Typed } from '@quicker-js/class-transformer';
import { SwaggerPathMethodResponseInfoSchema } from '../swagger-path-method-response-info-schema';
import { SwaggerPathMethodResponseInfoContent } from '../swagger-path-method-response-info-content';

/**
 * @class SwaggerPathMethodResponseInfo
 */
export class SwaggerPathMethodResponseInfo {
  @Typed()
  public description: string;

  /**
   * only 2.0
   */
  @Typed(SwaggerPathMethodResponseInfoSchema)
  public schema?: SwaggerPathMethodResponseInfoSchema;

  /**
   * only 3.0
   */
  @Typed(SwaggerPathMethodResponseInfoContent)
  public content?: SwaggerPathMethodResponseInfoContent;

  /**
   * ref
   */
  private get ref(): string {
    if (this.content && this.content['*/*'] && this.content['*/*'].schema) {
      const o = this.content['*/*'].schema;
      return o.$ref || o.originalRef || o.type || '';
    } else if (this.schema) {
      return (
        this.schema.$ref || this.schema.originalRef || this.schema.type || ''
      );
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
}

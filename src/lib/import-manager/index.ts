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

/**
 * @class ImportManager
 */
export class ImportManager extends Map<
  string,
  { default?: string; members: Set<string> }
> {
  /**
   *
   * @param key
   * @param value
   */
  public set(
    key: string,
    value: { default?: string; members?: Set<string> }
  ): this {
    const newVar = this.get(key);
    if (newVar) {
      if (value.default) {
        newVar.default = value.default;
      }
      if (newVar.members) {
        if (value.members) {
          value.members.forEach((o) => newVar.members.add(o));
        }
      } else if (value.members) {
        newVar.members = value.members;
      }
    } else {
      if (!value.members) {
        value.members = new Set();
      }
      super.set(key, value as any);
    }
    return this;
  }
}

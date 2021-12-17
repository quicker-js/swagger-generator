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
  Decorator,
  factory,
  ObjectLiteralExpression,
  PropertyAssignment,
  PropertyDeclaration,
  SyntaxKind,
  TypeNode,
} from 'typescript';
import { AstFile } from '../ast-file';
import { SourceFileProperty } from '../source-file-property';
import { ModelSourceFile } from '../model-source-file';
import { ParserUtil, TypescriptFactoryUtil } from '../utils';
import { SwaggerPathMethodParameter } from '../swagger';

/**
 * @class AstFileProperty
 */
export class AstFileProperty implements AstFilePropertyImpl {
  /**
   * 同名成员表
   */
  public sourceProperties: Set<SourceFileProperty> = new Set();

  /**
   * 构造函数
   * @param astFile 所属文件
   * @param name 成员名称
   * @private
   */
  private constructor(public astFile: AstFile, public name: string) {}

  /**
   * 创建类型
   * @param type
   * @param name
   */
  public createTypeNode(type: string, name?: string): TypeNode {
    switch (type) {
      case 'array':
        return factory.createArrayTypeNode(
          name
            ? factory.createTypeReferenceNode(
                factory.createIdentifier(name),
                undefined
              )
            : factory.createKeywordTypeNode(SyntaxKind.AnyKeyword)
        );
      case 'object':
        return name
          ? factory.createTypeReferenceNode(
              factory.createIdentifier(name),
              undefined
            )
          : factory.createKeywordTypeNode(SyntaxKind.AnyKeyword);
      case 'string':
        return factory.createKeywordTypeNode(SyntaxKind.StringKeyword);
      case 'integer':
        return factory.createKeywordTypeNode(SyntaxKind.NumberKeyword);
      case 'float':
        return factory.createKeywordTypeNode(SyntaxKind.NumberKeyword);
      case 'double':
        return factory.createKeywordTypeNode(SyntaxKind.NumberKeyword);
      case 'number':
        return factory.createKeywordTypeNode(SyntaxKind.NumberKeyword);
      default:
        return factory.createKeywordTypeNode(SyntaxKind.AnyKeyword);
    }
  }

  /**
   * 获取成员的类型
   */
  public getTypeNode(): TypeNode {
    const list: Map<string, TypeNode> = new Map();
    const isGeneric = this.isGeneric();
    this.sourceProperties.forEach((o) => {
      const { type, ref } = o;
      let keyName: string;
      if (isGeneric) {
        list.set('T', this.createTypeNode('object', 'T'));
      } else {
        const typeName = type || 'object';
        if (ref) {
          const name = ParserUtil.removeGenericParameter(ref);
          const typeName = type || 'object';
          keyName = typeName + name;
          list.set(keyName, this.createTypeNode(typeName, name));
        } else {
          list.set(typeName, this.createTypeNode(typeName));
        }
      }
    });

    if (list.size === 0) {
      list.set('any', factory.createKeywordTypeNode(SyntaxKind.AnyKeyword));
    }
    return factory.createUnionTypeNode(Array.from(list.values()));
  }

  /**
   * 获取装饰器
   */
  public getDecorators(): Decorator[] {
    const decorators: Decorator[] = [];
    const propDecorators: Decorator[] = [];
    const decoratorApiPropertyArgs: Map<string, PropertyAssignment> = new Map();
    const decoratorPropArgs: Map<string, PropertyAssignment> = new Map();
    const descriptions: string[] = [];

    this.sourceProperties.forEach((o) => {
      const { type, description, format, required, property } = o;
      if (type) {
        decoratorApiPropertyArgs.set(
          'type',
          factory.createPropertyAssignment(
            factory.createIdentifier('type'),
            factory.createStringLiteral(type)
          )
        );
      }

      if (description) {
        if (!descriptions.includes(description)) {
          descriptions.push(description);
        }
        decoratorApiPropertyArgs.set(
          'description',
          factory.createPropertyAssignment(
            factory.createIdentifier('description'),
            factory.createStringLiteral(description)
          )
        );
      }

      if (format) {
        decoratorApiPropertyArgs.set(
          'format',
          factory.createPropertyAssignment(
            factory.createIdentifier('format'),
            factory.createStringLiteral(format)
          )
        );
      }

      if (
        property instanceof SwaggerPathMethodParameter &&
        required !== undefined
      ) {
        decoratorApiPropertyArgs.set(
          'required',
          factory.createPropertyAssignment(
            factory.createIdentifier('required'),
            required ? factory.createTrue() : factory.createFalse()
          )
        );
      }

      if (o.in) {
        decoratorApiPropertyArgs.set(
          'in',
          factory.createPropertyAssignment(
            factory.createIdentifier('in'),
            factory.createStringLiteral(o.in)
          )
        );
      }
    });

    if (descriptions.length) {
      decorators.push(
        TypescriptFactoryUtil.createPropertyJsDoc(descriptions.join('\n'))
      );
    }

    if (decoratorApiPropertyArgs.size) {
      decorators.push(
        factory.createDecorator(
          factory.createCallExpression(
            factory.createIdentifier('ApiProperty'),
            undefined,
            [
              factory.createObjectLiteralExpression(
                Array.from(decoratorApiPropertyArgs.values()),
                true
              ),
            ]
          )
        )
      );
    }

    const scenesArgs: ObjectLiteralExpression[] = [];

    this.sourceProperties.forEach((o) => {
      if (o.ref) {
        let name = ParserUtil.removeGenericParameter(o.ref);
        // 如果是泛型
        if (this.isGeneric() && o.sourceFile instanceof ModelSourceFile) {
          if (name === 'string') {
            name = 'String';
          } else if (
            name === 'integer' ||
            name === 'float' ||
            name === 'double'
          ) {
            name = 'Number';
          }
          if (o.type === 'array') {
            scenesArgs.push(
              factory.createObjectLiteralExpression(
                [
                  factory.createPropertyAssignment(
                    factory.createIdentifier('type'),
                    factory.createIdentifier('Array')
                  ),
                  factory.createPropertyAssignment(
                    factory.createIdentifier('elementType'),
                    factory.createIdentifier(name)
                  ),
                  factory.createPropertyAssignment(
                    factory.createIdentifier('value'),
                    factory.createStringLiteral(
                      Array.from(o.sourceFile.originGenerics)[0]
                    )
                  ),
                ],
                true
              )
            );
          } else {
            scenesArgs.push(
              factory.createObjectLiteralExpression([
                factory.createPropertyAssignment(
                  factory.createIdentifier('type'),
                  factory.createIdentifier(name)
                ),
                factory.createPropertyAssignment(
                  factory.createIdentifier('value'),
                  factory.createStringLiteral(
                    Array.from(o.sourceFile.originGenerics)[0]
                  )
                ),
              ])
            );
          }
        } else {
          decoratorPropArgs.set(
            'type',
            factory.createPropertyAssignment(
              factory.createIdentifier('type'),
              factory.createIdentifier(name)
            )
          );
        }
      } else {
        const { dateTime, date, enable } = this.astFile.handler.config.moment;
        if ((o.format === 'date-time' || o.format === 'date') && enable) {
          this.astFile.imports.set('moment', {
            default: 'moment',
          });
          propDecorators.push(
            factory.createDecorator(
              factory.createCallExpression(
                factory.createIdentifier('Prop'),
                undefined,
                [
                  factory.createObjectLiteralExpression(
                    [
                      factory.createPropertyAssignment(
                        factory.createIdentifier('toPlainOnly'),
                        factory.createTrue()
                      ),
                      factory.createPropertyAssignment(
                        factory.createIdentifier('transform'),
                        factory.createArrowFunction(
                          undefined,
                          undefined,
                          [
                            factory.createParameterDeclaration(
                              undefined,
                              undefined,
                              undefined,
                              factory.createIdentifier('value'),
                              undefined,
                              undefined,
                              undefined
                            ),
                          ],
                          undefined,
                          factory.createToken(
                            SyntaxKind.EqualsGreaterThanToken
                          ),
                          factory.createCallExpression(
                            factory.createPropertyAccessExpression(
                              factory.createCallExpression(
                                factory.createIdentifier('moment'),
                                undefined,
                                [factory.createIdentifier('value')]
                              ),
                              factory.createIdentifier('format')
                            ),
                            undefined,
                            [
                              factory.createStringLiteral(
                                o.format === 'date' ? date : dateTime
                              ),
                            ]
                          )
                        )
                      ),
                    ],
                    true
                  ),
                ]
              )
            ),
            factory.createDecorator(
              factory.createCallExpression(
                factory.createIdentifier('Prop'),
                undefined,
                [
                  factory.createObjectLiteralExpression(
                    [
                      factory.createPropertyAssignment(
                        factory.createIdentifier('toInstanceOnly'),
                        factory.createTrue()
                      ),
                      factory.createPropertyAssignment(
                        factory.createIdentifier('transform'),
                        factory.createArrowFunction(
                          undefined,
                          undefined,
                          [
                            factory.createParameterDeclaration(
                              undefined,
                              undefined,
                              undefined,
                              factory.createIdentifier('value'),
                              undefined,
                              undefined,
                              undefined
                            ),
                          ],
                          undefined,
                          factory.createToken(
                            SyntaxKind.EqualsGreaterThanToken
                          ),
                          factory.createCallExpression(
                            factory.createIdentifier('moment'),
                            undefined,
                            [factory.createIdentifier('value')]
                          )
                        )
                      ),
                    ],
                    true
                  ),
                ]
              )
            )
          );
        }
      }
    });

    if (scenesArgs.length) {
      this.astFile.imports.set('@quicker-js/class-transformer', {
        members: new Set(['Scene']),
      });
      decoratorPropArgs.set(
        'scenes',
        factory.createPropertyAssignment(
          factory.createIdentifier('scenes'),
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier('Scene'),
              factory.createIdentifier('from')
            ),
            undefined,
            scenesArgs
          )
        )
      );
    }

    if (decoratorPropArgs.size) {
      propDecorators.push(
        factory.createDecorator(
          factory.createCallExpression(
            factory.createIdentifier('Prop'),
            undefined,
            [
              factory.createObjectLiteralExpression(
                Array.from(decoratorPropArgs.values()),
                true
              ),
            ]
          )
        )
      );
    }

    if (propDecorators.length) {
      decorators.push(...propDecorators);
    } else {
      decorators.push(
        factory.createDecorator(
          factory.createPropertyAccessExpression(
            factory.createIdentifier('Prop'),
            factory.createIdentifier('default')
          )
        )
      );
    }

    return decorators;
  }

  /**
   * 获取成员AST代码
   */
  public getPropertyDeclaration(): PropertyDeclaration {
    return factory.createPropertyDeclaration(
      this.getDecorators(),
      [factory.createModifier(SyntaxKind.PublicKeyword)],
      this.name,
      undefined,
      this.getTypeNode(),
      undefined
    );
  }

  /**
   * 检查字段是否为泛型参数
   */
  public isGeneric(): boolean {
    return Array.from(this.sourceProperties).some((o) => o.isGeneric());
  }

  /**
   * 创建 AstFileProperty书库
   * @param option
   */
  public static create(option: AstFilePropertyImpl): AstFileProperty {
    return new AstFileProperty(option.astFile, option.name);
  }
}

export interface AstFilePropertyImpl {
  astFile: AstFile;
  name: string;
}

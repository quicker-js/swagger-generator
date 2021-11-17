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
  createSourceFile,
  Decorator,
  EmitHint,
  factory,
  ImportDeclaration,
  NodeFlags,
  PropertyAssignment,
  PropertyDeclaration,
  ScriptTarget,
  SourceFile,
  Statement,
  SyntaxKind,
  TypeNode,
  TypeParameterDeclaration,
} from 'typescript';
import path from 'path';
import { SwaggerDefinition } from '../swagger-definition';
import { FileManager } from '../../file-manager';
import { SwaggerPathMethod } from '../swagger-path-method';
import { ParseHandler } from '../../parse-handler';
import { ImportManager } from '../../import-manager';
import { Dependency } from '../../dependency';
import { ParserUtil, TypescriptFactoryUtil } from '../../utils';
import { SwaggerDefinitionProperty } from '../swagger-definition-property';
import { SwaggerPathMethodParameter } from '../swagger-path-method-parameter';
import classTransformer from '@quicker-js/class-transformer';
import { NameReplacer, PathReplacer } from '../../config';

/**
 * @class SwaggerFile
 */
export class SwaggerFile {
  /**
   * 获取文件的绝对路径
   */
  public get absolutePath(): string {
    return this.absolute + '.ts';
  }

  /**
   * 获取文件的绝对路径
   */
  public get absolute(): string {
    return path.join(this.fileManager.path, this.filePath);
  }

  /**
   * 是否为要生成的文件
   */
  public isTrue = true;

  /**
   * 需要导入的资源
   */
  public imports: ImportManager = new ImportManager();

  /**
   * 成员列表
   */
  private dependencies: Map<PropertyKey, Set<Dependency>> = new Map();

  /**
   * 类装饰器列表
   */
  public decorators: Decorator[] = [];

  /**
   * 构造函数
   * @param fileManager
   * @param fileName
   * @param filePath
   * @param type
   * @param generics
   * @param definition
   * @param pathMethod
   * @param method
   * @param url
   */
  public constructor(
    private readonly fileManager: FileManager,
    public readonly fileName: string,
    public readonly filePath: string,
    public readonly type: 'path' | 'definition',
    public readonly generics: Set<string>,
    public readonly definition: SwaggerDefinition | undefined,
    public readonly pathMethod: SwaggerPathMethod | undefined,
    public readonly method: 'post' | 'put' | 'delete' | 'get' | undefined,
    public readonly url: string | undefined
  ) {
    if (definition) {
      definition.properties.forEach((property, key) => {
        let name = property.getRef();
        const { replaces } = this.fileManager.namespaceManager.handler.config;
        replaces.forEach((o) => {
          if (o instanceof NameReplacer && o.test && o.value) {
            name = name.replace(o.test, o.value);
          }
        });
        if (name && this.fileManager.definitions.has(name)) {
          this.dependencies.set(
            key,
            new Set([
              Dependency.create({
                name,
                swaggerFile: this,
                definitionProperty: property,
                generics: Array.from(this.generics),
              }),
            ])
          );
        }
      });
    }

    // 检测path是否有[0].参数 提取出新的path File对象
    if (pathMethod) {
      const groupBySubParameters = pathMethod.getGroupBySubParameters();
      groupBySubParameters.forEach((v, k) => {
        const swaggerPathMethod = classTransformer.plainToInstance(
          SwaggerPathMethod,
          {
            tags: pathMethod.tags,
            parameters: v,
          }
        );

        const swaggerFile = SwaggerFile.fromPath(
          this.fileManager,
          swaggerPathMethod,
          `${this.filePath}/${k}`,
          '' as any
        );

        pathMethod.parameters.push(
          classTransformer.plainToInstance(SwaggerPathMethodParameter, {
            name: k,
            type: 'array',
          })
        );

        this.dependencies.set(
          k,
          new Set<Dependency>([
            Dependency.create({
              name: swaggerFile.fileName,
              swaggerFile: swaggerFile,
              definitionProperty: undefined,
              generics: [],
            }),
          ])
        );
        this.fileManager.paths.set(swaggerFile.fileName, swaggerFile);
      });
    }
    this.fileManager.addListener('assetsParsed', () => {
      this.generator();
    });
  }

  /**
   * 比较文件
   * @param otherFile
   */
  public merge(otherFile: SwaggerFile): void {
    // 合并泛型参数
    if (otherFile.generics) {
      otherFile.generics.forEach((o) => this.generics.add(o));
    }
    /**
     * 合并依赖项
     */
    otherFile.dependencies.forEach((v, k) => {
      const dep = this.dependencies.get(k);
      if (dep) {
        v.forEach((v) => {
          if (!dep.has(v)) {
            dep.add(v);
          }
        });
      } else {
        this.dependencies.set(k, v);
      }
    });
  }

  /**
   * 生成文件
   */
  private generator(): void {
    // 判断是否允许生成
    if (!this.isTrue) {
      return;
    }

    // 导入泛型依赖
    this.generics.forEach((o) => {
      const s = ParserUtil.removeGenericParameter(o);
      if (this.type === 'definition') {
        const newVar = this.fileManager.definitions.get(s);
        if (newVar) {
          this.imports.set(
            `./${path.relative(path.dirname(this.absolute), newVar.absolute)}`,
            {
              members: new Set([s]),
            }
          );
        }
      }
    });

    // 导入依赖项目
    this.dependencies.forEach((o) => {
      o.forEach((value) => {
        if (this.type === 'definition') {
          const newVar = this.fileManager.definitions.get(value.name);
          if (newVar) {
            this.imports.set(
              `./${path.relative(
                path.dirname(this.absolute),
                newVar.absolute
              )}`,
              {
                members: new Set([value.name]),
              }
            );
          }
        }
      });
    });

    const file = this.createSourceFile();
    const sourceFile = this.createNode();
    ParserUtil.write(
      this.absolutePath,
      ParserUtil.unescape(
        ParseHandler.printer.printNode(EmitHint.SourceFile, sourceFile, file)
      )
    );
  }

  /**
   * 创建导入信息
   * @private
   */
  private createImportDeclarations(): ImportDeclaration[] {
    const list: ImportDeclaration[] = [];
    this.imports.forEach((value, path) => {
      list.push(
        factory.createImportDeclaration(
          undefined,
          undefined,
          factory.createImportClause(
            false,
            value.default ? factory.createIdentifier(value.default) : undefined,
            factory.createNamedImports(
              Array.from(value.members).map((item) =>
                factory.createImportSpecifier(
                  undefined,
                  factory.createIdentifier(
                    ParserUtil.removeGenericParameter(item)
                  )
                )
              )
            )
          ),
          factory.createStringLiteral(path)
        )
      );
    });
    return list;
  }

  /**
   * 创建资源文件
   * @private
   */
  private createSourceFile(): SourceFile {
    return createSourceFile(this.absolutePath, '', ScriptTarget.Latest);
  }

  /**
   * 创建注释
   * @private
   */
  private createClassComment(): Statement {
    let comment = path.relative(
      this.fileManager.namespaceManager.handler.config.output,
      this.absolutePath
    );
    const description = this.getDescription();
    if (description) {
      comment = `${description}\n${comment}`;
    }
    return TypescriptFactoryUtil.createClassJsDoc(comment, this.fileName);
  }

  /**
   * 创建类型参数
   * @private
   */
  private createTypeParameters(): TypeParameterDeclaration[] {
    if (this.generics.size > 0) {
      return [
        factory.createTypeParameterDeclaration(
          factory.createIdentifier('T'),
          this.fileManager.namespaceManager.handler.config
            .allowTypeParameterDeclarations
            ? factory.createUnionTypeNode(
                Array.from(this.generics).map((o) =>
                  factory.createTypeReferenceNode(
                    factory.createIdentifier(o),
                    undefined
                  )
                )
              )
            : undefined
        ),
      ];
    }

    return [];
  }

  /**
   * 获取依赖
   * @param dependencies
   */
  public getDeps(dependencies: Dependency[]): Array<{
    name: string;
    elementType: string;
    generic: string;
    isArray: boolean;
  }> {
    const list: Array<{
      name: string;
      elementType: string;
      generic: string;
      isArray: boolean;
    }> = dependencies.map((o) => {
      const generic = o.generics[0];
      if (generic) {
        const elementType = ParserUtil.getGenericParameters(generic).find((c) =>
          this.fileManager.definitions.has(c)
        );
        return {
          name: ParserUtil.removeGenericParameter(generic),
          elementType: elementType,
          generic: generic,
          isArray: o.isArray(),
        };
      }
      const elementType = ParserUtil.getGenericParameters(o.name).find((c) =>
        this.fileManager.definitions.has(c)
      );
      return {
        name: ParserUtil.removeGenericParameter(o.name),
        elementType,
        generic: o.name,
        isArray: o.isArray(),
      };
    }) as any;
    this.generics.forEach((generic) => {
      if (!list.find((x) => x.generic === generic)) {
        const s = ParserUtil.removeGenericParameter(generic);
        const newVar1 = this.fileManager.definitions.get(s);
        if (newVar1) {
          list.push({
            name: newVar1.fileName,
            generic,
            elementType: undefined,
            isArray: false,
          } as any);
        } else {
          const find = ParserUtil.getGenericParameters(generic).find((o) => {
            const newVar = this.fileManager.definitions.get(o);
            if (newVar) {
              this.imports.set(
                `./${path.relative(
                  path.dirname(this.absolute),
                  newVar.absolute
                )}`,
                {
                  members: new Set([newVar.fileName]),
                }
              );
              return true;
            }
          });
          if (find) {
            list.push({
              name: find,
              generic,
              elementType: undefined,
              isArray: false,
            } as any);
          }
        }
      }
    });
    return list;
  }

  /**
   * 创建class成员
   * @private
   */
  private createClassProperties(): PropertyDeclaration[] {
    const list: PropertyDeclaration[] = [];
    if (this.definition) {
      let index = 0;
      this.definition.properties.forEach((definitionProperty, propertyName) => {
        const decorators: Decorator[] = [];

        const isGenericParameter = this.isGenericParameter(propertyName);
        const dependencies = Array.from(
          this.dependencies.get(propertyName) || []
        );

        const args: PropertyAssignment[] = [];

        if (definitionProperty.description) {
          args.push(
            factory.createPropertyAssignment(
              factory.createIdentifier('description'),
              factory.createStringLiteral(definitionProperty.description)
            )
          );
        }

        if (definitionProperty.format) {
          args.push(
            factory.createPropertyAssignment(
              factory.createIdentifier('format'),
              factory.createStringLiteral(definitionProperty.format)
            )
          );
        }

        if (definitionProperty.type) {
          args.push(
            factory.createPropertyAssignment(
              factory.createIdentifier('type'),
              factory.createStringLiteral(definitionProperty.type)
            )
          );
        }

        if (args.length) {
          decorators.push(
            factory.createDecorator(
              factory.createCallExpression(
                factory.createIdentifier('ApiProperty'),
                undefined,
                [factory.createObjectLiteralExpression(args)]
              )
            )
          );
        }

        if (dependencies.length) {
          if (isGenericParameter) {
            this.imports.set('@quicker-js/class-transformer', {
              members: new Set(['Scene']),
            });
            decorators.push(
              factory.createDecorator(
                factory.createCallExpression(
                  factory.createIdentifier('Prop'),
                  undefined,
                  [
                    factory.createObjectLiteralExpression(
                      [
                        factory.createPropertyAssignment(
                          'scenes',
                          factory.createCallExpression(
                            factory.createPropertyAccessExpression(
                              factory.createIdentifier('Scene'),
                              factory.createIdentifier('from')
                            ),
                            undefined,
                            this.getDeps(dependencies).map((o) => {
                              return o.isArray
                                ? factory.createObjectLiteralExpression(
                                    [
                                      factory.createPropertyAssignment(
                                        factory.createIdentifier('type'),
                                        factory.createIdentifier('Array')
                                      ),
                                      factory.createPropertyAssignment(
                                        factory.createIdentifier('elementType'),
                                        factory.createIdentifier(
                                          o.elementType || o.name
                                        )
                                      ),
                                      factory.createPropertyAssignment(
                                        factory.createIdentifier('value'),
                                        factory.createStringLiteral(
                                          `${this.fileName}<${
                                            o.generic || o.name
                                          }>`
                                        )
                                      ),
                                    ],
                                    true
                                  )
                                : factory.createObjectLiteralExpression(
                                    [
                                      factory.createPropertyAssignment(
                                        factory.createIdentifier('type'),
                                        factory.createIdentifier(
                                          o.elementType || o.name
                                        )
                                      ),
                                      factory.createPropertyAssignment(
                                        factory.createIdentifier('value'),
                                        factory.createStringLiteral(
                                          `${this.fileName}<${
                                            o.generic || o.elementType
                                          }>`
                                        )
                                      ),
                                    ],
                                    true
                                  );
                            })
                          )
                        ),
                      ],
                      true
                    ),
                  ]
                )
              )
            );
          } else {
            decorators.push(
              factory.createDecorator(
                factory.createCallExpression(
                  factory.createIdentifier('Prop'),
                  undefined,
                  [
                    factory.createObjectLiteralExpression([
                      factory.createPropertyAssignment(
                        'type',
                        factory.createIdentifier(
                          ParseHandler.nameParser(
                            dependencies[0].name,
                            'camelCase'
                          )
                        )
                      ),
                    ]),
                  ]
                )
              )
            );
          }
        } else if (
          definitionProperty.format === 'date-time' &&
          this.fileManager.namespaceManager.handler.config.moment &&
          this.fileManager.namespaceManager.handler.config.moment.enable
        ) {
          decorators.push(
            factory.createDecorator(
              factory.createCallExpression(
                factory.createIdentifier('Prop'),
                undefined,
                [
                  factory.createObjectLiteralExpression([
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
                        factory.createToken(SyntaxKind.EqualsGreaterThanToken),
                        factory.createCallExpression(
                          factory.createIdentifier('moment'),
                          undefined,
                          [factory.createIdentifier('value')]
                        )
                      )
                    ),
                  ]),
                ]
              )
            ),
            factory.createDecorator(
              factory.createCallExpression(
                factory.createIdentifier('Prop'),
                undefined,
                [
                  factory.createObjectLiteralExpression([
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
                        factory.createToken(SyntaxKind.EqualsGreaterThanToken),
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
                              this.fileManager.namespaceManager.handler.config
                                .moment.format || 'YYYY-MM-DD HH:mm:ss'
                            ),
                          ]
                        )
                      )
                    ),
                  ]),
                ]
              )
            )
          );
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

        if (index) {
          list.push(TypescriptFactoryUtil.createNewLine());
        }

        if (definitionProperty.description) {
          list.push(
            TypescriptFactoryUtil.createPropertyJsDoc(
              definitionProperty.description
            )
          );
        }

        list.push(
          factory.createPropertyDeclaration(
            decorators,
            [factory.createModifier(SyntaxKind.PublicKeyword)],
            propertyName,
            undefined,
            this.createClassPropertyType(
              definitionProperty,
              propertyName,
              isGenericParameter
            ),
            undefined
          )
        );

        index++;
      });
    }

    if (this.pathMethod) {
      let index = 0;
      this.pathMethod.getNoSubParameters().map((pathMethodParameter) => {
        const decorators: Decorator[] = [];

        const args: PropertyAssignment[] = [
          factory.createPropertyAssignment(
            factory.createIdentifier('in'),
            factory.createStringLiteral(pathMethodParameter.in || 'query')
          ),
        ];

        if (pathMethodParameter.required) {
          args.push(
            factory.createPropertyAssignment(
              factory.createIdentifier('required'),
              factory.createTrue()
            )
          );
        }

        if (pathMethodParameter.getFormat()) {
          args.push(
            factory.createPropertyAssignment(
              factory.createIdentifier('format'),
              factory.createStringLiteral(pathMethodParameter.getFormat())
            )
          );
        }

        if (pathMethodParameter.getType()) {
          args.push(
            factory.createPropertyAssignment(
              factory.createIdentifier('type'),
              factory.createStringLiteral(pathMethodParameter.getType())
            )
          );
        }

        if (pathMethodParameter.description) {
          args.push(
            factory.createPropertyAssignment(
              factory.createIdentifier('description'),
              factory.createStringLiteral(pathMethodParameter.description)
            )
          );
        }

        if (args.length) {
          decorators.push(
            factory.createDecorator(
              factory.createCallExpression(
                factory.createIdentifier('ApiProperty'),
                undefined,
                [factory.createObjectLiteralExpression(args)]
              )
            )
          );
        }

        const format = pathMethodParameter.getFormat();

        const dependencies = Array.from(
          this.dependencies.get(pathMethodParameter.name) || []
        );

        if (dependencies.length) {
          const newVar = this.fileManager.paths.get(dependencies[0].name);

          if (newVar) {
            this.imports.set(
              `./${path.relative(
                path.dirname(this.absolute),
                newVar.absolute
              )}`,
              {
                members: new Set([newVar.fileName]),
              }
            );
            const args: PropertyAssignment[] = [
              factory.createPropertyAssignment(
                'type',
                factory.createIdentifier(newVar.fileName)
              ),
            ];
          }

          decorators.push(
            factory.createDecorator(
              factory.createCallExpression(
                factory.createIdentifier('Prop'),
                undefined,
                [factory.createObjectLiteralExpression(args)]
              )
            )
          );
        } else if (
          format === 'date' &&
          this.fileManager.namespaceManager.handler.config.moment &&
          this.fileManager.namespaceManager.handler.config.moment.enable
        ) {
          decorators.push(
            factory.createDecorator(
              factory.createCallExpression(
                factory.createIdentifier('Prop'),
                undefined,
                [
                  factory.createObjectLiteralExpression([
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
                        factory.createToken(SyntaxKind.EqualsGreaterThanToken),
                        factory.createCallExpression(
                          factory.createIdentifier('moment'),
                          undefined,
                          [factory.createIdentifier('value')]
                        )
                      )
                    ),
                  ]),
                ]
              )
            ),
            factory.createDecorator(
              factory.createCallExpression(
                factory.createIdentifier('Prop'),
                undefined,
                [
                  factory.createObjectLiteralExpression([
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
                        factory.createToken(SyntaxKind.EqualsGreaterThanToken),
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
                              this.fileManager.namespaceManager.handler.config
                                .moment.format || 'YYYY-MM-DD HH:mm:ss'
                            ),
                          ]
                        )
                      )
                    ),
                  ]),
                ]
              )
            )
          );
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

        if (index) {
          list.push(TypescriptFactoryUtil.createNewLine());
        }

        if (pathMethodParameter.description) {
          list.push(
            TypescriptFactoryUtil.createPropertyJsDoc(
              pathMethodParameter.description
            )
          );
        }

        list.push(
          factory.createPropertyDeclaration(
            decorators,
            [factory.createModifier(SyntaxKind.PublicKeyword)],
            pathMethodParameter.name,
            pathMethodParameter.required
              ? undefined
              : factory.createToken(SyntaxKind.QuestionToken),
            this.createQueryPropertyType(
              pathMethodParameter,
              pathMethodParameter.name
            ),
            undefined
          )
        );

        index++;
      });
    }
    return list;
  }

  /**
   *
   * @param pathMethodParameter
   * @param propertyName
   * @private
   */
  private createQueryPropertyType(
    pathMethodParameter: SwaggerPathMethodParameter,
    propertyName: string
  ): TypeNode {
    const type = pathMethodParameter.getType();
    const format = pathMethodParameter.getFormat();

    const dependencies = Array.from(this.dependencies.get(propertyName) || []);

    switch (type) {
      case 'string':
        if (format === 'date') {
          this.imports.set('moment', {
            default: 'moment',
            members: new Set(['Moment']),
          });
          return factory.createTypeReferenceNode(
            factory.createIdentifier('Moment'),
            undefined
          );
        }
        return factory.createKeywordTypeNode(SyntaxKind.StringKeyword);
      case 'integer':
        return factory.createKeywordTypeNode(SyntaxKind.NumberKeyword);
      case 'number':
        return factory.createKeywordTypeNode(SyntaxKind.NumberKeyword);
      case 'boolean':
        return factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword);
      case 'array':
        if (dependencies.length) {
          if (dependencies.length) {
            return factory.createUnionTypeNode(
              dependencies.map((o) =>
                factory.createArrayTypeNode(
                  factory.createTypeReferenceNode(
                    factory.createIdentifier(o.name),
                    undefined
                  )
                )
              )
            );
          }
        }
        return factory.createArrayTypeNode(
          factory.createKeywordTypeNode(SyntaxKind.AnyKeyword)
        );
      default:
        return factory.createKeywordTypeNode(SyntaxKind.AnyKeyword);
    }
  }

  /**
   * 创建类成员的类型
   * @param definitionProperty
   * @param propertyName
   * @param isGenericParameter
   * @private
   */
  private createClassPropertyType(
    definitionProperty: SwaggerDefinitionProperty,
    propertyName: string,
    isGenericParameter: boolean
  ): TypeNode {
    const dependencies = Array.from(this.dependencies.get(propertyName) || []);
    switch (definitionProperty.type) {
      case 'array':
        if (isGenericParameter) {
          return factory.createArrayTypeNode(
            factory.createTypeReferenceNode(
              factory.createIdentifier('T'),
              undefined
            )
          );
        }

        if (dependencies.length) {
          return factory.createUnionTypeNode(
            dependencies.map((o) =>
              factory.createArrayTypeNode(
                factory.createTypeReferenceNode(
                  factory.createIdentifier(o.name),
                  undefined
                )
              )
            )
          );
        }

        return factory.createArrayTypeNode(
          factory.createKeywordTypeNode(SyntaxKind.AnyKeyword)
        );
      case 'number':
        return factory.createKeywordTypeNode(SyntaxKind.NumberKeyword);
      case 'integer':
        return factory.createKeywordTypeNode(SyntaxKind.NumberKeyword);
      case 'boolean':
        return factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword);
      case 'string':
        if (definitionProperty.format === 'date-time') {
          this.imports.set('moment', {
            default: 'moment',
            members: new Set(['Moment']),
          });
          return factory.createTypeReferenceNode(
            factory.createIdentifier('Moment'),
            undefined
          );
        }
        return factory.createKeywordTypeNode(SyntaxKind.StringKeyword);
      default:
        if (isGenericParameter) {
          return factory.createTypeReferenceNode(
            factory.createIdentifier('T'),
            undefined
          );
        } else if (dependencies.length) {
          return factory.createUnionTypeNode(
            dependencies.map((o) =>
              factory.createTypeReferenceNode(
                factory.createIdentifier(o.name),
                undefined
              )
            )
          );
        }
        return factory.createKeywordTypeNode(SyntaxKind.AnyKeyword);
    }
  }

  /**
   * 创建类的装饰器
   */
  public createClassDeclarationDecorators(): Decorator[] {
    const decorators: Decorator[] = [];

    if (this.type === 'path' && this.url) {
      // 导入依赖
      this.imports.set('@quicker-js/http', {
        members: new Set(['ApiRequest']),
      });

      const args: PropertyAssignment[] = [];

      if (this.url) {
        args.push(
          factory.createPropertyAssignment(
            factory.createIdentifier('url'),
            factory.createStringLiteral(this.url)
          )
        );
      }

      if (this.method) {
        args.push(
          factory.createPropertyAssignment(
            factory.createIdentifier('method'),
            factory.createStringLiteral(this.method)
          )
        );
      }

      const description = this.getDescription();

      if (description) {
        args.push(
          factory.createPropertyAssignment(
            factory.createIdentifier('description'),
            factory.createStringLiteral(description)
          )
        );
      }

      if (this.pathMethod) {
        const respon = this.pathMethod.responses['200'];
        if (respon) {
          let scene = respon.getRef();
          const { replaces } = this.fileManager.namespaceManager.handler.config;
          replaces.forEach((o) => {
            if (o instanceof NameReplacer && o.test && o.value) {
              scene = scene.replace(o.test, o.value);
            }
          });

          if (scene) {
            const responseIdentifier = ParserUtil.removeGenericParameter(scene);
            const newVar = this.fileManager.definitions.get(responseIdentifier);
            if (newVar) {
              this.imports.set(
                `./${path.relative(
                  path.dirname(this.absolute),
                  newVar.absolute
                )}`,
                {
                  members: new Set([newVar.fileName]),
                }
              );
              args.push(
                factory.createPropertyAssignment(
                  factory.createIdentifier('scene'),
                  factory.createStringLiteral(scene)
                ),
                factory.createPropertyAssignment(
                  factory.createIdentifier('response'),
                  factory.createIdentifier(responseIdentifier)
                )
              );
            }
          }
        }
      }

      if (args.length) {
        decorators.push(
          factory.createDecorator(
            factory.createCallExpression(
              factory.createIdentifier('ApiRequest'),
              undefined,
              [factory.createObjectLiteralExpression(args)]
            )
          )
        );
      }
    }
    return decorators;
  }

  /**
   * 创建文件节点
   * @private
   */
  private createNode(): SourceFile {
    this.imports.set('@quicker-js/class-transformer', {
      members: new Set(['Prop']),
    });
    this.imports.set('@quicker-js/http', {
      members: new Set(['ApiProperty']),
    });
    const propertyDeclarations = this.createClassProperties();
    const decorators = this.createClassDeclarationDecorators();
    const importDeclarations = this.createImportDeclarations();
    return factory.createSourceFile(
      [
        this.createClassComment(),
        ...importDeclarations,
        TypescriptFactoryUtil.createNewLine(),
        factory.createClassDeclaration(
          decorators,
          [factory.createModifier(SyntaxKind.ExportKeyword)],
          this.fileName,
          this.createTypeParameters(),
          undefined,
          propertyDeclarations
        ),
      ],
      factory.createToken(SyntaxKind.EndOfFileToken),
      NodeFlags.None
    );
  }

  /**
   * 获取标题
   */
  public getTitle(): string {
    if (this.definition) {
      return this.definition.title;
    }
    return '';
  }

  /**
   * 获取描述
   */
  public getDescription(): string {
    if (this.pathMethod) {
      return this.pathMethod.getDescription();
    } else if (this.definition) {
      return this.definition.description;
    }
    return '';
  }

  /**
   * 判断是否为泛型参数
   * @param propertyName
   */
  public isGenericParameter(propertyName: string): boolean {
    const newVar = this.dependencies.get(propertyName);
    return !!Array.from(newVar || []).find((o) => o.isGenericParameter());
  }

  /**
   *  从swagger-definition创建
   * @param fileManager
   * @param definition
   * @param name
   */
  public static fromDefinition(
    fileManager: FileManager,
    definition: SwaggerDefinition,
    name: string
  ): SwaggerFile {
    const { replaces } = fileManager.namespaceManager.handler.config;

    const generics = new Set<string>();
    const genericParameter = ParserUtil.getGenericParameter(name);
    if (genericParameter) {
      replaces.forEach(
        (o) =>
          o.value !== undefined && genericParameter.replace(o.test, o.value)
      );
      generics.add(genericParameter);
    }

    let parsedName = ParseHandler.nameParser(name.split('«')[0], 'camelCase');

    // 替换path
    replaces.map((o) => {
      if (o instanceof NameReplacer && typeof o.value === 'string') {
        parsedName = parsedName.replace(o.test, o.value);
      }
    });

    return new SwaggerFile(
      fileManager,
      parsedName,
      fileManager.namespaceManager.handler.fileNameParser(
        parsedName.split('«')[0]
      ),
      'definition',
      generics,
      definition,
      undefined,
      undefined,
      undefined
    );
  }

  /**
   * 从swagger-path创建
   * @param fileManager
   * @param pathMethod
   * @param url
   * @param method
   */
  public static fromPath(
    fileManager: FileManager,
    pathMethod: SwaggerPathMethod,
    url: string,
    method: 'post' | 'put' | 'delete' | 'get'
  ): SwaggerFile {
    let name = url;
    const { replaces } = fileManager.namespaceManager.handler.config;

    // 替换path
    replaces.map((o) => {
      if (o instanceof PathReplacer && typeof o.value === 'string') {
        name = name.replace(o.test, o.value);
      }
    });

    return new SwaggerFile(
      fileManager,
      ParseHandler.nameParser(method + name, 'camelCase'),
      fileManager.namespaceManager.handler.fileNameParser(method + name),
      'path',
      new Set(),
      undefined,
      pathMethod,
      method,
      /^\//.test(url) ? url : undefined
    );
  }
}

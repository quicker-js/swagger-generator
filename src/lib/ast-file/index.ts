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
  factory,
  NodeFlags,
  Statement,
  SyntaxKind,
  createSourceFile,
  TypeParameterDeclaration,
  SourceFile as TsSourceFile,
  ScriptTarget,
  EmitHint,
  ImportDeclaration,
  Decorator,
  PropertyAssignment,
} from 'typescript';
import path from 'path';

import { SourceFile } from '../source-file';
import { ImportSources } from '../import-sources';
import { AstFileProperty } from '../ast-file-property';
import { ParseHandler } from '../parse-handler';
import { ParserUtil, TypescriptFactoryUtil } from '../utils';
import { ModelSourceFile } from '../model-source-file';
import { SourceManager } from '../source-manager';
import { PathSourceFile } from '../path-source-file';

/**
 * Ast文件
 */
export class AstFile implements AstFileImpl {
  /**
   * 如果有多个相同的文件会sourceFiles.size > 1
   */
  public sourceFiles: Set<SourceFile> = new Set();

  /**
   * 需要导入的资源
   */
  public imports = new ImportSources();

  /**
   * 成员列表
   */
  protected properties: Map<string, AstFileProperty> = new Map();

  /**
   * 文件名称
   */
  public readonly fileName: string;

  /**
   * 文件路径
   */
  public readonly filePath: string;

  /**
   * 绝对路径
   */
  public readonly absolute: string;

  /**
   * 获取handler
   */
  public get handler(): ParseHandler {
    return this.sourceManager.handler;
  }

  /**
   * 当前文件的目录名称
   */
  public get dirname(): string {
    return path.dirname(this.absolute);
  }

  /**
   * constructor
   * @param sourceFile 资源文件地址
   * @param sourceManager 资源管理器
   */
  public constructor(
    public sourceFile: SourceFile,
    public sourceManager: SourceManager
  ) {
    this.fileName = sourceFile.fileName;
    this.filePath = sourceFile.filePath;
    this.absolute = sourceFile.absolute;
    this.sourceFiles.add(sourceFile);
  }

  /**
   * 获取描述
   * @private
   */
  private getDescription(): string | undefined {
    for (const item of Array.from(this.sourceFiles)) {
      const description = item.getDescription();
      if (description) {
        return description;
      }
    }
  }

  /**
   * 创建注释
   * @private
   */
  private getClassComment(): Statement {
    let comment = path.relative(this.handler.config.output, this.absolute);
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
  private getTypeParameters(): TypeParameterDeclaration[] {
    if (this.hasGeneric()) {
      const generics = new Set<string>();
      this.sourceFiles.forEach((o) => {
        if (o instanceof ModelSourceFile) {
          o.originGenerics.forEach((generic) => generics.add(generic));
        }
      });
      return [
        factory.createTypeParameterDeclaration(
          factory.createIdentifier('T'),
          this.handler.config.allowTypeParameterDeclarations
            ? factory.createUnionTypeNode(
                Array.from(generics).map((o) =>
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
   * 创建资源文件
   * @private
   */
  private getTsSourceFile(): TsSourceFile {
    return createSourceFile(this.absolute, '', ScriptTarget.Latest);
  }

  /**
   * 创建导入信息
   * @private
   */
  private getImportDeclarations(): ImportDeclaration[] {
    const list: ImportDeclaration[] = [];
    this.imports.forEach((value, path) => {
      if (value.members && !value.members.has(this.fileName)) {
        list.push(
          factory.createImportDeclaration(
            undefined,
            undefined,
            factory.createImportClause(
              false,
              value.default
                ? factory.createIdentifier(value.default)
                : undefined,
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
            factory.createStringLiteral(path.replace(/\.ts$/, ''))
          )
        );
      } else {
        list.push(
          factory.createImportDeclaration(
            undefined,
            undefined,
            factory.createImportClause(
              false,
              value.default
                ? factory.createIdentifier(value.default)
                : undefined,
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
            factory.createStringLiteral(path.replace(/\.ts$/, ''))
          )
        );
      }
    });
    return list;
  }

  /**
   * 创建装饰器
   * @private
   */
  private getDecorators(): Decorator[] {
    const decorators: Decorator[] = [];
    this.sourceFiles.forEach((o) => {
      if (o instanceof PathSourceFile) {
        const { method, url, pathMethod } = o;
        const description = o.getDescription();
        if (url && method && pathMethod) {
          const respon = pathMethod.responses['200'];
          const list: PropertyAssignment[] = [
            factory.createPropertyAssignment(
              factory.createIdentifier('url'),
              factory.createStringLiteral(url)
            ),
            factory.createPropertyAssignment(
              factory.createIdentifier('method'),
              factory.createStringLiteral(method)
            ),
          ];

          if (description) {
            list.push(
              factory.createPropertyAssignment(
                factory.createIdentifier('description'),
                factory.createStringLiteral(description)
              )
            );
          }
          if (respon) {
            const ref = respon.getRef();
            if (ref) {
              const name = ParserUtil.removeGenericParameter(ref);
              const { pathSourceFiles, modelSourceFiles } = o.source;
              const file =
                pathSourceFiles.get(name) || modelSourceFiles.get(name);
              if (file) {
                let pathName = path.relative(
                  path.dirname(this.absolute),
                  file.absolute
                );
                if (!/^\.{2}/.test(pathName)) {
                  pathName = './' + pathName;
                }
                this.imports.set(pathName, {
                  members: new Set([name]),
                });

                list.push(
                  factory.createPropertyAssignment(
                    factory.createIdentifier('scene'),
                    factory.createStringLiteral(ref)
                  )
                );

                list.push(
                  factory.createPropertyAssignment(
                    factory.createIdentifier('response'),
                    factory.createIdentifier(name)
                  )
                );
              }
            }
          }
          decorators.push(
            factory.createDecorator(
              factory.createCallExpression(
                factory.createIdentifier('ApiRequest'),
                undefined,
                [factory.createObjectLiteralExpression(list)]
              )
            )
          );
        }
      }
    });
    return decorators;
  }

  /**
   * 创建文件节点
   * @private
   */
  private createNode(): TsSourceFile {
    const propertyDeclarations = Array.from(this.properties.values()).map((o) =>
      o.getPropertyDeclaration()
    );
    const decorators = this.getDecorators();
    const importDeclarations = this.getImportDeclarations();
    return factory.createSourceFile(
      [
        this.getClassComment(),
        ...importDeclarations,
        TypescriptFactoryUtil.createNewLine(),
        factory.createClassDeclaration(
          decorators,
          [factory.createModifier(SyntaxKind.ExportKeyword)],
          this.fileName,
          this.getTypeParameters(),
          undefined,
          propertyDeclarations
        ),
      ],
      factory.createToken(SyntaxKind.EndOfFileToken),
      NodeFlags.None
    );
  }

  /**
   * 是否为泛型类
   * @private
   */
  private hasGeneric(): boolean {
    return Array.from(this.properties.values()).some((o) => o.isGeneric());
  }

  /**
   * 生命周期创建
   */
  public create(): void {
    this.sourceFiles.forEach((sourceFile) => {
      const properties = sourceFile.getProperties();
      properties.forEach((property) => {
        const astFileProperty =
          this.properties.get(property.name) ||
          AstFileProperty.create({ astFile: this, name: property.name });
        astFileProperty.sourceProperties.add(property);
        this.properties.set(property.name, astFileProperty);
      });
    });

    if (this.sourceFile instanceof PathSourceFile) {
      this.imports.set('@quicker-js/http', {
        members: new Set(['ApiRequest']),
      });
    }

    // 添加导入依赖
    if (this.properties.size > 0) {
      this.imports.set('@quicker-js/http', {
        members: new Set(['ApiProperty']),
      });

      this.imports.set('@quicker-js/class-transformer', {
        members: new Set(['Prop']),
      });
    }

    this.properties.forEach((o) => {
      // 创建完毕之后 获取ref
      o.sourceProperties.forEach((sourceFileProperty) => {
        const { ref, sourceFile } = sourceFileProperty;
        const { modelSourceFiles, pathSourceFiles } = sourceFile.source;
        if (ref) {
          const name = ParserUtil.removeGenericParameter(ref);
          const file = modelSourceFiles.get(name) || pathSourceFiles.get(name);
          if (file) {
            let pathName = path.relative(
              path.dirname(this.absolute),
              file.absolute
            );
            if (!/^\.{2}/.test(pathName)) {
              pathName = './' + pathName;
            }
            this.imports.set(pathName, {
              members: new Set([name]),
            });
          }
        }
      });
    });
  }

  /**
   * 生命周期生成
   */
  public async generator(): Promise<void> {
    const sourceFile = this.createNode();
    const tsSourceFile = this.getTsSourceFile();
    await ParserUtil.write(
      tsSourceFile.fileName,
      ParserUtil.unescape(
        ParseHandler.printer.printNode(
          EmitHint.SourceFile,
          sourceFile,
          tsSourceFile
        )
      )
    );
  }

  /**
   * 创建AstFile实例
   */
  public static create(option: AstFileImpl): AstFile {
    return new AstFile(option.sourceFile, option.sourceManager);
  }
}

export interface AstFileImpl {
  sourceFile: SourceFile;
  sourceManager: SourceManager;
}

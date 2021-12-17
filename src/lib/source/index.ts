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

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import validator from 'validator';
import classTransformer from '@quicker-js/class-transformer';

import { SwaggerApi, SwaggerPathMethod } from '../swagger';
import { SourceManager } from '../source-manager';
import { LoadAssetException, LoadAssetExceptionCode } from '../exceptions';
import { Config } from '../config';
import { ModelSourceFile } from '../model-source-file';
import { PathSourceFile } from '../path-source-file';
import { AstFile } from '../ast-file';

/**
 * 资源文件
 */
export class Source implements SourceImpl {
  /**
   * 构造函数
   * @param assetPath 资源文件的路径 (url | path)
   * @param namespace 命名空间
   * @param sourceManager 资源管理器
   * @private
   */
  private constructor(
    public readonly assetPath: string,
    public readonly namespace: string,
    public readonly sourceManager: SourceManager
  ) {}

  /**
   * 当前资源路径
   */
  public get path(): string {
    return path.join(this.rootPath, this.namespace);
  }

  /**
   * 不包含namespace
   */
  public get rootPath(): string {
    const { output } = this.sourceManager.handler.config;
    if (output) {
      return output;
    }
    return path.resolve();
  }

  /**
   * 加载文件
   */
  public async loadFile(): Promise<SwaggerApi> {
    if (validator.isURL(this.assetPath)) {
      try {
        const res = await axios.get(this.assetPath);
        return classTransformer.plainToInstance(SwaggerApi, res.data);
      } catch (e) {
        throw LoadAssetException.create(LoadAssetExceptionCode.NOT_FOUND);
      }
    } else {
      if (!fs.existsSync(this.assetPath)) {
        throw LoadAssetException.create(LoadAssetExceptionCode.NOT_FOUND);
      }
      return classTransformer.plainToInstance(
        SwaggerApi,
        require(this.assetPath)
      );
    }
  }

  /**
   * 解析文件
   */
  public async parse(): Promise<void> {
    // 加载文件
    const swaggerApi = await this.loadFile();
    const { config } = this.sourceManager.handler;
    this.parseDefinitions(swaggerApi, config);
    this.parsePaths(swaggerApi, config);
  }

  /**
   * 模型文件列表
   */
  public modelSourceFiles: Map<string, ModelSourceFile> = new Map();

  /**
   * path文件列表
   */
  public pathSourceFiles: Map<string, PathSourceFile> = new Map();

  /**
   * 解析 Definitions
   * @param swaggerApi
   * @param config
   * @private
   */
  private parseDefinitions(swaggerApi: SwaggerApi, config: Config): void {
    const { excludes } = config;
    swaggerApi.swaggerDefinitions.forEach((swaggerDefinition, key) => {
      const modelSourceFile = ModelSourceFile.from(
        this,
        swaggerDefinition,
        key
      );
      // 排除文件
      const find = excludes.find((o) => o.test(modelSourceFile.fileName));
      if (!find) {
        this.modelSourceFiles.set(modelSourceFile.fileName, modelSourceFile);
        const astFile = this.sourceManager.files.get(modelSourceFile.absolute);
        if (astFile) {
          astFile.sourceFiles.add(modelSourceFile);
        } else {
          this.sourceManager.files.set(
            modelSourceFile.absolute,
            AstFile.create({
              sourceFile: modelSourceFile,
              sourceManager: this.sourceManager,
            })
          );
        }
      }
    });
  }

  /**
   * 解析 Paths
   * @param swaggerApi
   * @param config
   * @private
   */
  private parsePaths(swaggerApi: SwaggerApi, config: Config): void {
    const { excludes } = config;
    swaggerApi.paths.forEach((swaggerPath, key) => {
      let pathSourceFile: PathSourceFile | null = null;
      const pathName = ((swaggerApi.basePath || '') + key).replace(
        /\/{2}/g,
        '/'
      );
      if (swaggerPath.get) {
        pathSourceFile = PathSourceFile.from(
          this,
          swaggerPath.get,
          key,
          'get',
          pathName
        );
      }
      if (swaggerPath.post) {
        pathSourceFile = PathSourceFile.from(
          this,
          swaggerPath.post,
          key,
          'post',
          pathName
        );
      }
      if (swaggerPath.put) {
        pathSourceFile = PathSourceFile.from(
          this,
          swaggerPath.put,
          key,
          'put',
          pathName
        );
      }
      if (swaggerPath.delete) {
        pathSourceFile = PathSourceFile.from(
          this,
          swaggerPath.delete,
          key,
          'delete',
          pathName
        );
      }

      if (pathSourceFile) {
        const { fileName, pathMethod, method } = pathSourceFile;
        const find = excludes.find((o) => o.test(fileName));
        if (!find) {
          if (pathMethod && method) {
            const group = pathMethod.getGroupBySubParameters();
            group.forEach((parameters, nameKey) => {
              const swaggerPathMethod = classTransformer.plainToInstance(
                SwaggerPathMethod,
                {
                  description: pathMethod.getDescription(),
                  parameters,
                }
              );
              const pathSourceFile1 = PathSourceFile.from(
                this,
                swaggerPathMethod,
                [key, nameKey].join('/'),
                method,
                ''
              );

              this.pathSourceFiles.set(
                pathSourceFile1.fileName,
                pathSourceFile1
              );

              this.sourceManager.files.set(
                pathSourceFile1.absolute,
                AstFile.create({
                  sourceFile: pathSourceFile1,
                  sourceManager: this.sourceManager,
                })
              );
            });
          }

          this.pathSourceFiles.set(fileName, pathSourceFile);
          this.sourceManager.files.set(
            pathSourceFile.absolute,
            AstFile.create({
              sourceFile: pathSourceFile,
              sourceManager: this.sourceManager,
            })
          );
        }
      }
    });
  }

  /**
   * 创建资源
   * @param option
   */
  public static create(option: SourceImpl): Source {
    return new Source(option.assetPath, option.namespace, option.sourceManager);
  }
}

export interface SourceImpl {
  readonly assetPath: string;
  readonly namespace: string;
  readonly sourceManager: SourceManager;
}

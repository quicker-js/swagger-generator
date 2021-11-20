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
import chalk from 'chalk';
import axios from 'axios';
import path from 'path';
import validator from 'validator';
import classTransformer from '@quicker-js/class-transformer';

import { SwaggerApi } from '../swagger';
import { LoadAssetException, LoadAssetExceptionCode } from '../exceptions';
import { NamespaceManager } from '../namespace-manager';
import { SwaggerFile } from '../swagger/swagger-file';
import EventEmitter from 'events';

/**
 * @class FileManager
 */
export class FileManager extends EventEmitter {
  /**
   * 命名空间
   */

  /**
   * 构造函数
   * @param assetPath
   * @param namespaceManager
   * @param namespace
   */
  public constructor(
    public readonly assetPath: string,
    public readonly namespaceManager: NamespaceManager,
    public namespace: string
  ) {
    super();
    this.setMaxListeners(namespaceManager.handler.config.fileMax);
  }

  /**
   * definition列表
   */
  public definitions = new Map<string, SwaggerFile>();

  /**
   * path集合
   */
  public paths = new Map<string, SwaggerFile>();

  /**
   * SwaggerApi实例
   */
  public swaggerApi?: SwaggerApi;

  /**
   * 当前文件管理器所在路径
   */
  public get path(): string {
    const { output } = this.namespaceManager.handler.config;
    if (output) {
      return path.join(output, this.namespace);
    }
    return path.resolve(this.namespace);
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
   * 解析
   */
  public async parse(): Promise<void> {
    try {
      this.emit('beforeAssetsLoad');
      const swaggerApi = await this.loadFile();

      this.emit('assetsLoaded');
      this.swaggerApi = swaggerApi;
      this.emit('beforeAssetsParse');
      const { excludes } = this.namespaceManager.handler.config;
      swaggerApi.swaggerDefinitions.forEach((swaggerDefinition, key) => {
        const swaggerFile = SwaggerFile.fromDefinition(
          this,
          swaggerDefinition,
          key
        );
        // 排除文件
        if (excludes.find((o) => o.test(swaggerFile.fileName))) {
          swaggerFile.isTrue = false;
        } else {
          const definition = this.definitions.get(swaggerFile.fileName);
          if (definition) {
            swaggerFile.isTrue = false;
            definition.merge(swaggerFile);
          } else {
            this.definitions.set(swaggerFile.fileName, swaggerFile);
          }
        }
      });
      swaggerApi.paths.forEach((swaggerPath, key) => {
        let swaggerFile: SwaggerFile | null = null;
        if (swaggerPath.get) {
          swaggerFile = SwaggerFile.fromPath(this, swaggerPath.get, key, 'get');
        }

        if (swaggerPath.post) {
          swaggerFile = SwaggerFile.fromPath(
            this,
            swaggerPath.post,
            key,
            'post'
          );
        }

        if (swaggerPath.put) {
          swaggerFile = SwaggerFile.fromPath(this, swaggerPath.put, key, 'put');
        }

        if (swaggerPath.delete) {
          swaggerFile = SwaggerFile.fromPath(
            this,
            swaggerPath.delete,
            key,
            'delete'
          );
        }
        if (swaggerFile) {
          if (
            excludes.find((o) => swaggerFile && o.test(swaggerFile.fileName))
          ) {
            swaggerFile.isTrue = false;
          } else {
            this.paths.set(swaggerFile.fileName, swaggerFile);
          }
        }
      });
      this.emit('assetsParsed');
    } catch (e) {
      if (e instanceof LoadAssetException) {
        console.error(chalk.red(e));
      }
    }
  }

  /**
   * 创建FileManager实例
   * @param options
   */
  public static create(options: FileManagerImpl): FileManager {
    return new FileManager(
      options.assetPath,
      options.namespaceManager,
      options.namespace
    );
  }
}

export interface FileManagerImpl {
  assetPath: string;
  namespaceManager: NamespaceManager;
  namespace: string;
}

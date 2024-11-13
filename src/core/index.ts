import { existsSync, writeFileSync } from 'node:fs';
import { join, parse } from 'node:path';
import { logger } from 'rslog';
import glob from 'fast-glob';
import color from 'picocolors';
import { prettySize } from 'pretty-size';
import Table from 'cli-table3';
import i18next from 'i18next';

import { version } from '../shared/package';
import { logHelpMessage } from '../shared/help';
import { generateFile, getFileType, isDir, isFileExist } from '../shared/fs';
import { CONVERT_TYPE, IMAGE_PATTERN } from '../shared/constant';
import { isImageFile, isCompressFile, getImageType } from '../shared/type';
import type { ResponseStore, ResponseProcess } from '../types/response';
import { spinner } from '../shared/spinner';
import { getRandomIp } from '../shared/ip';

import {
  compressFile,
  compressDir,
  compressZip,
  unCompressZip,
} from '../shared/compress';
import { getArgs, type ArgsType } from '../shared/args';
import { isVietnameseEnvironment } from '../shared/i18next';

export default class Tinypng {
  private version: string;
  private args: ArgsType;
  private files: string[];
  private images: Set<string>;
  private imagesMap: Map<string, { success: boolean; data: ResponseProcess }>;
  private compressTmp: Map<string, string>;
  constructor() {
    this.version = version;
    this.args = getArgs();
    this.files = this.args._;
    this.images = new Set();
    this.imagesMap = new Map();
    this.compressTmp = new Map();
  }
  async init() {
    await this.handleArgs();
    await this.processFiles();
    await this.compressAndProcessImages();
    await this.outputResults();
  }

  /**
   * 解析命令行参数并根据参数执行相应的操作
   *
   * 如果提供了`--version`参数，则输出当前版本号并结束程序
   * 如果提供了`--help`参数，则输出帮助信息并结束程序
   * 如果没有提供任何参数，则继续执行程序的其他部分
   *
   * @returns {Promise<void>} 一个 Promise，表示解析完成
   */

  async handleArgs() {
    return new Promise<void>((resolve) => {
      const language = this.args.language;
      const defaultLang = isVietnameseEnvironment() ? 'zh' : 'en';
      const lang = typeof language === 'string' ? language : defaultLang;
      if (this.args.language) {
        i18next.changeLanguage(lang);
      }
      if (this.args.version) {
        logger.greet(`\n➜  @julytian/tinypng-cli v${this.version} \n`);
        return;
      }
      if (this.args.help) {
        logHelpMessage(lang);
        return;
      }
      resolve();
    });
  }

  /**
   * 处理图片压缩结果
   *
   * 如果没有需要处理的图片，则直接返回
   * 如果参数中指定了 --zip，则开始压缩文件，并在完成后打印成功信息
   *
   * @returns {void} 无返回值
   */

  async outputResults() {
    if (!this.imagesMap.size) return;
    const table = new Table({
      head: [i18next.t('address'), i18next.t('compression-details')],
      style: { head: ['green'] },
    });
    for (const [key, { success, data }] of this.imagesMap) {
      const ratio = (
        ((data.originalSize - data.size) / data.originalSize) *
        100
      ).toFixed(2);
      table.push([
        color.cyan(key),
        success
          ? `${i18next.t('original-size')}: ${color.yellow(
              prettySize(data.originalSize, true)
            )}，${i18next.t('compressed-size')}: ${color.green(
              prettySize(data.size, true)
            )}，${i18next.t('compression-ratio')}: ${color.magenta(
              ratio + '%'
            )}`
          : `${i18next.t('compression-failure') + ': ' + color.red(data.message)}`,
      ]);
    }
    console.log(table.toString());
    if (this.args.zip) {
      spinner.reset();
      spinner.start({
        text: color.cyan(`${i18next.t('start-generating-archive')}... \n`),
        color: 'cyan',
      });
      try {
        await this.createArchive();
        spinner.success({
          text: color.blue(`${i18next.t('generate-archive-success')} \n`),
          mark: ':)',
        });
      } catch (error) {
        spinner.error({
          text: color.red(`${i18next.t('generate-archive-failure')} \n`),
          mark: ':(',
        });
      } finally {
        spinner.clear();
      }
    }
  }

  /**
   * 创建压缩归档
   *
   * 该方法会遍历所有文件，并根据文件类型进行压缩处理：
   * - 压缩文件：调用 compressZip 方法进行压缩
   * - 目录：调用 compressDir 方法进行压缩
   * - 图片文件：调用 compressFile 方法进行压缩
   *
   * 如果文件不存在或压缩失败，则记录错误信息
   *
   * @returns {Promise<void>} 当所有文件压缩完成后，返回一个 Promise
   */

  async createArchive() {
    const ext = this.getArchiveExtension();
    await Promise.all(
      this.files.map(async (file) => {
        if (!existsSync(file)) {
          return;
        }
        if (isCompressFile(file)) {
          await compressZip(file, this.compressTmp.get(file)!);
        } else if (isDir(file)) {
          await compressDir(file, ext);
        } else if (isImageFile(file)) {
          await compressFile(file, ext);
        }
      })
    );
  }

  /**
   * 收集并处理指定的文件列表
   *
   * 遍历给定的文件列表，检查每个文件是否存在，并根据文件类型进行相应的处理：
   * - 压缩文件：解压并添加图片
   * - 目录：递归添加图片
   * - 图片文件：直接添加
   *
   * @returns {Promise<void>} - 当所有文件处理完成后，返回一个 Promise
   */

  async processFiles() {
    await Promise.all(
      this.files.map(async (file) => {
        if (!isFileExist(file)) {
          logger.error(`${file} ${i18next.t('file-not-found')}`);
          return;
        }
        if (isCompressFile(file)) {
          await unCompressZip(file, this.compressTmp);
          const targetDir = this.compressTmp.get(file);
          if (targetDir) {
            this.addImagesFromDirectory(targetDir);
          }
        } else if (isDir(file)) {
          this.addImagesFromDirectory(file);
        } else if (isImageFile(file)) {
          this.addImagePath(file);
        }
      })
    );
  }

  /**
   * 将指定的文件路径添加到图片集中
   *
   * @param {string} imagePath - 要添加的图片文件路径
   * @returns {void} 该函数没有返回值
   */

  addImagePath(imagePath: string) {
    this.images.add(imagePath);
  }

  /**
   * 在目录中查找并添加图片文件
   *
   * @param {string} directoryPath - 要处理的目录路径
   * @returns {void} 该函数没有返回值
   */

  addImagesFromDirectory(directoryPath: string) {
    const recursive = this.args.recursive;
    const pattern = recursive ? `**/${IMAGE_PATTERN}` : `${IMAGE_PATTERN}`;
    const files = glob.sync(`${directoryPath}/${pattern}`);
    if (files.length) {
      files.forEach((file) => this.addImagePath(file));
    }
  }

  /**
   * 异步上传图片文件并记录上传状态。
   *
   * 该函数会遍历所有图片文件，异步上传每个文件，并在上传完成后记录日志。
   * 如果上传过程中发生错误，函数会记录错误信息并抛出异常。
   *
   * @returns {Promise<void>} 当所有文件上传完成后，返回一个 Promise。
   */

  async compressAndProcessImages() {
    if (!this.images.size) return;
    spinner.start({
      text: color.cyan(`${i18next.t('start-compressing-image')}... \n`),
      color: 'cyan',
    });
    try {
      await Promise.all(
        Array.from(this.images).map(this.uploadAndProcessImage, this)
      );
      spinner.success({
        text: color.cyan(`${i18next.t('compress-image-complete')}: \n`),
        mark: ':)',
      });
    } catch (error) {
      spinner.error({
        text: color.red(`${i18next.t('compress-image-failure')}: \n`),
        mark: ':(',
      });
    } finally {
      spinner.clear();
    }
  }

  /**
   * 异步上传文件并处理上传结果
   *
   * @param {string} imagePath - 要上传的图片路径
   * @returns {Promise<void>} - 当文件上传和处理完成后，返回一个 Promise
   */

  async uploadAndProcessImage(imagePath: string) {
    try {
      const file = generateFile(imagePath);
      const response = await fetch('https://tinypng.com/backend/opt/store', {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Cache-Control': 'no-cache',
          'X-Forwarded-For': getRandomIp(),
        },
      });

      if (response.status === 201) {
        const responseData = (await response.json()) as ResponseStore;
        await this.processImage(imagePath, responseData);
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      this.imagesMap.set(imagePath, {
        success: false,
        data: { message: error.message } as any,
      });
    }
  }

  /**
   * 处理已经上传的图片，可能包括格式转换等操作
   *
   * @param {string} imagePath - 要处理的图片的路径
   * @param {ResponseStore} data - 上传图片后返回的数据
   * @returns {Promise<void>} - 当图片处理完成后，返回一个 Promise
   */

  async processImage(imagePath: string, data: ResponseStore) {
    try {
      const originalType = getFileType(imagePath);
      const type = CONVERT_TYPE[this.args.convert!];
      const params = {
        key: data.key,
        originalSize: data.size,
        originalType,
      };
      if (type) {
        // @ts-ignore
        params.convert = { type };
      }
      const response = await fetch('https://tinypng.com/backend/opt/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Forwarded-For': getRandomIp(),
        },
        body: JSON.stringify(params),
      });
      const responseData = (await response.json()) as ResponseProcess;
      if (response.status === 201) {
        await this.updateImage(
          imagePath,
          {
            ...responseData,
            originalSize: data.size,
          },
          originalType
        );
      } else {
        throw new Error(responseData?.message);
      }
    } catch (error) {
      throw new Error(error?.message);
    }
  }

  /**
   * 异步更新图片的函数。此函数从给定的 URL 获取数据，
   * 并将其写入到指定的文件路径。如果图片的 MIME 类型与原始类型不同，
   * 它还会更新图片的扩展名。
   *
   * @param imagePath - 要更新的图片的路径。
   * @param data - 包含图片更新所需信息的对象。
   * @param originalType - 图片的原始 MIME 类型。
   * @returns 当图片成功更新时解析的 Promise。
   */

  async updateImage(
    filePath: string,
    data: ResponseProcess,
    originalType: string
  ) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const response = await fetch(data.url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const { ext, mime } = await getImageType(buffer);
        let path = filePath;
        if (mime !== originalType) {
          const { dir, name } = parse(filePath);
          path = join(dir, `${name}.${ext}`);
        }
        writeFileSync(path, buffer, 'binary');
        this.imagesMap.set(path, { success: true, data });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 获取压缩文件的扩展名。
   *
   * @remarks
   * 该方法根据传入的参数决定压缩文件的扩展名。
   * 如果参数是一个字符串，则返回该字符串作为扩展名。
   * 如果参数不是字符串，则返回默认的扩展名 'zip'。
   *
   * @returns 压缩文件的扩展名。
   */

  getArchiveExtension() {
    return typeof this.args.zip === 'string' ? this.args.zip : 'zip';
  }
}
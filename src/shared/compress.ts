import { basename, dirname, extname, join, parse, resolve } from 'node:path';
import { createWriteStream } from 'node:fs';
import type { ReadStream } from 'node:fs';
import { getZipType } from './fs';
import { copy, ensureDir, remove } from 'fs-extra';
import { logger } from 'rslog';
import compressing, { type streamHeaderWithMode } from 'compressing';

/**
 * 压缩ZIP文件函数。
 *
 * @param filePath - 要压缩的文件路径。
 * @param tmpDir - 临时目录路径。
 * @throws {Error} - 如果压缩过程中发生错误，将抛出错误。
 * @returns {Promise<void>} - 当压缩完成或发生错误时解析的 Promise。
 */

export async function compressZip(filePath: string, tmpDir: string) {
  const dirName = basename(filePath, extname(filePath));
  const needsCopy = !tmpDir.startsWith(dirName);
  const ext = getZipType(filePath) as string;
  try {
    if (needsCopy) {
      await copy(tmpDir, dirName);
    }
    await remove(filePath);
    await compressDir(needsCopy ? dirName : tmpDir, ext);
    if (needsCopy) {
      await remove(tmpDir);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * 压缩指定路径下的目录为指定格式的压缩文件
 * @param filePath - 要压缩目录的路径
 * @param ext - 压缩格式的扩展名，例如 'zip', 'tar', 'gz' 等
 * @returns {Promise<void>} - 当压缩完成或发生错误时解析的 Promise
 * @throws {Error} - 如果压缩过程中发生错误，将抛出错误
 */

export async function compressDir(filePath: string, extension: string) {
  const destPath = resolve(dirname(filePath), `${basename(filePath, extname(filePath))}.${extension}`);
  await compressing[extension].compressDir(filePath, destPath);
}

/**
 * 压缩单个文件为指定格式的压缩文件
 * @param filePath - 要压缩文件的路径
 * @param ext - 压缩格式的扩展名，例如 'zip', 'tar', 'gz' 等
 * @returns {Promise<void>} - 当压缩完成或发生错误时解析的 Promise
 * @throws {Error} - 如果压缩过程中发生错误，将抛出错误
 */

export async function compressFile(filePath: string, extension: string) {
  const destPath = resolve(dirname(filePath), `${basename(filePath, extname(filePath))}.${extension}`);
  await compressing[extension].compressFile(filePath, destPath);
}

/*
 * 解压缩ZIP文件函数。
 *
 * @param filePath - 要解压缩的ZIP文件路径。
 * @param compressTmp - 用于存储解压缩过程中临时文件路径的映射。
 * @returns {Promise<void>} 当解压缩完成或发生错误时解析的Promise。
 * @throws {Error} 如果解压缩过程中发生错误，将抛出错误。
 */
export async function unCompressZip(
  filePath: string,
  compressTmp: Map<string, string>
){
  return new Promise<void>(async (resolve2) => {
    let extension = getZipType(filePath) as string;
    const targetDir = parse(filePath).dir;
    const destPath = resolve(targetDir, `${basename(filePath, extname(filePath))}`);
    await compressing[extension].uncompress(filePath, dirname(destPath));
    compressTmp.set(filePath, basename(destPath));
    resolve2();
  })
}

export async function unCompressZip2(
  filePath: string,
  compressTmp: Map<string, string>
) {
  const ext = getZipType(filePath) as string;
  const unCompressStream = new compressing[ext].UncompressStream({
    source: filePath,
  });
  return new Promise<void>((resolve, reject) => {
    unCompressStream
      .on('entry', async (header, stream, next) => {
        // Skip macOS hidden files
        if (/__MACOSX|DS_Store$/.test(header.name)) {
          next();
          return;
        }
        try {
          await handleStream(filePath, header, stream, compressTmp);
          next();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject)
      .on('finish', () => {
        resolve();
      });
  });
}

/**
 * 处理流数据的函数，用于解压文件或目录
 * @param filePath - 原始文件路径
 * @param header - 当前处理的文件或目录的头部信息
 * @param stream - 数据读取流
 * @param compressTmp - 用于存储解压过程中临时文件路径的映射
 * @throws {Error} 如果在处理过程中发生错误，将抛出错误
 */

async function handleStream(
  filePath: string,
  header: streamHeaderWithMode,
  stream: ReadStream,
  compressTmp: Map<string, string>
) {
  const targetDir = parse(filePath).dir;
  try {
    if (header.type === 'file') {
      // Skip macOS hidden files
      if (/__MACOSX|DS_Store$/.test(header.name)) {
        return;
      }
      const fullFilePath = join(targetDir, header.name);
      await ensureDir(dirname(fullFilePath));
      const fileStream = createWriteStream(fullFilePath);
      await new Promise((resolve, reject) => {
        stream.pipe(fileStream);
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });
      compressTmp.set(filePath, dirname(fullFilePath));
    } else {
      const fullDirPath = join(targetDir, header.name);
      await ensureDir(fullDirPath);
      stream.resume();
    }
  } catch (error) {
    logger.error('Stream handling error', error);
    throw error;
  }
}
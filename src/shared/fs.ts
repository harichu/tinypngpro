import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { lookup } from 'mime-types';
import { extname } from 'node:path';

/**
* 检查文件是否存在
*
* @param filePath - 要检查的文件路径
* @returns 如果文件存在则返回 true，否则返回 false
*/

export function isFileExist(filePath: string): boolean {
  return existsSync(filePath);
}

/**
 * 检查指定路径是否为目录。
 *
 * @param dirPath - 要检查的路径。
 * @returns 如果路径是目录，则返回 true，否则返回 false。
 */

export function isDir(dirPath: string): boolean {
  return lstatSync(dirPath).isDirectory();
}

/**
* 从指定文件路径生成File对象。
*
* @param {string} filePath - 要读取的文件的路径。
* @returns {File} - 根据指定路径和内容生成的File对象。
*/

export function generateFile(filePath: string): File {
  const fileContent = readFileSync(filePath);
  const fileType = lookup(filePath) || 'application/octet-stream';
  return new File([fileContent], filePath, { type: fileType });
}

/**
 * 获取文件的 MIME 类型。
 * @param filePath 文件路径。
 * @returns 文件的 MIME 类型，如果无法获取则返回 'application/octet-stream'。
 */
export function getFileType(filePath: string): string {
  return lookup(filePath) || 'application/octet-stream';
}

/**
 * 获取给定文件路径的压缩文件类型。
 *
 * @param filePath - 要检查的文件路径。
 * @returns 压缩文件类型，如果文件不是压缩文件，则返回 'zip'。
 */

export function getZipType(filePath: string): string {
  return extname(filePath).slice(1) || 'zip';
}

class File extends Blob {
  name: string;
  lastModified: number;

  constructor(
    parts: BlobPart[],
    filename: string,
    options: FilePropertyBag = {}
  ) {
    // @ts-ignore
    super(parts, options);
    this.name = filename;
    this.lastModified = options.lastModified || Date.now();
  }
}
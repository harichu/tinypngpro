import { minimatch } from 'minimatch';
import fileType, { type FileTypeResult } from 'file-type';
import { IMAGE_PATTERN, COMPRESS_PATTERN } from '../shared/constant';

/**
 * 检查给定的文件路径是否为图像文件。
 *
 * @param filePath - 要检查的文件路径。
 * @returns 如果文件路径是图像文件，则返回 true，否则返回 false。
 */
export function isImageFile(filePath: string): boolean {
  return minimatch(filePath, IMAGE_PATTERN, { matchBase: true });
}

/**
 * 检查给定的文件路径是否为压缩文件。
 *
 * @param filePath - 要检查的文件路径。
 * @returns 如果文件路径是压缩文件，则返回 true，否则返回 false。
 */
export function isCompressFile(filePath: string): boolean {
  return minimatch(filePath, COMPRESS_PATTERN, { matchBase: true });
}

/**
 * 获取图像文件的类型信息。
 *
 * @param buffer - 图像文件的缓冲区数据。
 * @returns 包含图像文件扩展名和 MIME 类型的对象。
 * @throws {Error} 如果在处理过程中发生错误，将抛出错误。
 */
export async function getImageType(buffer: Buffer): Promise<FileTypeResult> {
  return fileType.fromBuffer(buffer) as unknown as FileTypeResult;
}

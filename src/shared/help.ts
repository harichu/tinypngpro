import { logger } from 'rslog';
import color from 'picocolors';

export function logHelpMessage(language: string) {
  logger.log(
    language === 'zh'
      ? `
  ${color.cyan('TinyPNG 命令行工具使用指南')}

  用法: tinypng <文件> [选项]

  选项:

    -h, --help       显示帮助信息
    -v, --version    显示已安装版本
    -z, --zip        将文件压缩为 zip、tar 或 tgz 格式
    -c, --convert    将图片转换为其他格式 (png|jpg|jpeg|webp)
    -r, --recursive  递归压缩文件
    -l, --language   设置输出语言，支持 zh (中文) | en (英文)

  示例:

    tinypng <文件>      压缩文件，支持单个文件、目录或 tar、zip、tgz 格式文件
    tinypng -z <文件>   将文件压缩为 zip 格式
    tinypng -c <文件>   将图片转换为其他格式
    tinypng -r <文件>   递归压缩文件
    tinypng -l <文件>   设置输出语言，支持 zh | en
    `
      : `
  ${color.cyan('TinyPNG Command Line Tool Usage Guide')}

  Usage: tinypng <file> [options]

  Options:

    -h, --help       Show help information
    -v, --version    Show installed version
    -z, --zip        Compress files to zip, tar, or tgz format
    -c, --convert    Convert images to other formats (png|jpg|jpeg|webp)
    -r, --recursive  Compress files recursively
    -l, --language   Set logger language, support zh (Chinese) | en (English)

  Examples:

    tinypng <file>      Compress files, support single files, directories or tar, zip, tgz format files
    tinypng -z <file>   Compress files to zip format
    tinypng -c <file>   Convert images to other formats
    tinypng -r <file>   Compress files recursively
    tinypng -l <file>   Set logger language, support zh | en
  `
  );
}
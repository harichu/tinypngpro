import minimist from 'minimist';
import type { Args } from '../types/args';

/**
 * 解析命令行参数。
 *
 * @remarks
 * 该函数使用`minimist`库解析命令行参数。
 * 支持的参数包括：
 * - `help`或`h`：显示帮助信息。
 * - `version`或`v`：显示版本信息。
 * - `zip`或`z`：指定压缩文件的格式。
 * - `convert`或`c`：指定转换操作。
 * - `recursive`或`r`：指定是否递归处理目录。
 * - `language`或`l`：指定语言，可选值：zh | en 。
 *
 * @returns 解析后的命令行参数对象。
 */

export function getArgs() {
  return minimist<Args>(process.argv.slice(2), {
    alias: {
      h: 'help',
      v: 'version',
      z: 'zip',
      c: 'convert',
      r: 'recursive',
      l: 'language',
    },
  });
}

export type ArgsType = ReturnType<typeof getArgs>;

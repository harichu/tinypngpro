# Tinypng CLI: Efficient Image Compression Tool

Tinypng CLI is a command-line tool that utilizes the **[Tinypng.com](https://tinypng.com/)** web version to compress images and support multiple format conversions and archive operations.
<img src="https://img.shields.io/npm/v/tinypngpro?style=flat-square" alt="npm version" />

## Features

- Supports multiple image formats: png, jpg, jpeg, webp
- Convenient compression methods: Single image, entire folder, or archive
- Flexible image format conversion: Mutual conversion between png, jpg, jpeg, webp
- Archive decompression: Supports tar, zip, tgz formats
- Packaging of compressed images: Generate tar, zip, tgz formats for archives

## Installation

```shell
# npm
npm i tinypngpro -g

# yarn
yarn i tinypngpro -g

# pnpm
pnpm i tinypngpro -g
```

## Quick Start

```shell
$ tinypngpro <file> [options]
# Help information
$ tinypngpro --help
# Version information
$ tinypngpro --version
# Language setting for output (zh, en)
$ tinypngpro -l zh
# Compress a single image
$ tinypngpro a.png
# Compress a single image and convert png to jpeg
$ tinypngpro a.png -c jpeg
# Compress a single image and generate zip archive
$ tinypngpro a.png -z
# Compress a single image and generate tar archive
$ tinypngpro a.png -z tar
# Compress images in directory a
$ tinypngpro a
# Recursively traverse directory a, compress all images in it
$ tinypngpro a -r
# Compress images in the directory and generate a zip archive
$ tinypngpro a -z
# Compress all images in the directory and generate a zip archive
$ tinypngpro a -r -z
# Compress all images in the directory and generate a tgz archive
$ tinypngpro a -r -z tgz
# Decompress a zip archive and compress images in it
$ tinypngpro a.zip
# Decompress a zip archive and compress images in it, and regenerate a zip archive
$ tinypngpro a.zip -z
# Decompress a zip archive and compress images in it, and regenerate a tar archive
$ tinypngpro a.zip -z tar
```

## Options

- -h, --help: Show help information.
- -v, --version: Show version number.
- -z, --zip : Generate archive of the specified format (zip, tar, tgz).
- -c, --convert : Convert images to the specified format (png, jpg, jpeg, webp).
- -r, --recursive: Recursively traverse folders.
- -l, --language : Set the output language (zh, en).

## Examples

```shell
# Compress the image named "a.png"
$ tinypngpro a.png

# Compress the image named "a.png" and convert it to jpeg
$ tinypngpro a.png -c jpeg

# Compress the image named "a.png" and generate a zip archive
$ tinypngpro a.png -z

# Compress all images in the folder named "images"
$ tinypngpro images -r

# Decompress the zip archive named "images.zip" and compress the images inside
$ tinypngpro images.zip
```

## License

This project is licensed under the [MIT License](https://github.com/harichu/tinypngpro/blob/master/LICENSE).
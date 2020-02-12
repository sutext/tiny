# Tiny

-   基于 tinypng.com 提供的压缩算法的命令行工具

## 说明

-   可用户命令行压缩指定 png 图片 或者 包含 png 图片的目录。
-   压缩后的文件会覆盖源文件 使用-b 或者--backup 可以备份源文件。
-   同一个文件被压缩后会生成缓存文件，当再次对该文件压缩的时候会自动使用缓存，
-   如果使用-f --no-cache 则跳过缓存直接压缩

## 使用方法

```shell
npm i @sutxt/tiny -g
tiny test.png -fb
tiny assets -b
```

```ts
import tiny from '@sutxt/tiny';
const assets = './assets';
tiny(assets).then(files => {
    console.log('succeed files:', files);
});
```

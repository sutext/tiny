/**
 * @description compress png image use tinypng
 * @param path image file path or directory
 * @param backup backup old file or not @default false if true generate *_bak.png file
 * @param nocache use cache or not @default false
 */
const tiny: (path: string, backup?: boolean, nocache?: boolean) => Promise<string[]>;
export default tiny;

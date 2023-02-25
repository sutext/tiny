/**
 * @description compress png image use tinypng
 * @param path image file path or directory
 * @param backup backup old file or not @default true if true generate *_bak.png file
 * @param nocache use cache or not @default false
 * @param size The batch process file counts when too many files. @default 10
 * @notice size must in (0,25]. otherwise default value will be used.
 */
declare const tiny: (path: string, backup?: boolean, nocache?: boolean, size?: number) => Promise<string[]>;
export default tiny;
/**
 * @description restore backup file if exist
 * @param path image file path or directory
 */
export const restore: (path:string)=>void;


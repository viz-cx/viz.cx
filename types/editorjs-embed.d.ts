// @editorjs/embed@2.8.0 ships types/index.d.ts but its package.json "exports" map has no
// "types" condition, so TS (moduleResolution: bundler) can't resolve them — upstream packaging bug.
declare module '@editorjs/embed'

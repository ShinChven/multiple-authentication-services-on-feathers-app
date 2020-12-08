export const realPath = (fileName?: string) => {
  const pathDivider = process.platform === 'win32' ? '\\' : '/';
  const projectRoot = __dirname.substring(0, __dirname.lastIndexOf(pathDivider));
  if (fileName) {
    return `${projectRoot}${pathDivider}${fileName}`;
  }
  return projectRoot;
};

export const parentPath = (filepath?: string) => {
  const pathDivider = process.platform === 'win32' ? '\\' : '/';
  return filepath?.substring(0, filepath?.lastIndexOf(pathDivider));
};

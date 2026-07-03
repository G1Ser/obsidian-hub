import type { PagedOptions, ResolvedPagedOptions } from './types';

const DEFAULT_OPTIONS: ResolvedPagedOptions = {
  rootSelector: '#source',

  pageWidth: '210mm',
  pageHeight: '297mm',

  marginTop: '5mm',
  marginRight: '10mm',
  marginBottom: '5mm',
  marginLeft: '10mm',
};

export const mergeOptions = (options: PagedOptions = {}): ResolvedPagedOptions => {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
  };
};

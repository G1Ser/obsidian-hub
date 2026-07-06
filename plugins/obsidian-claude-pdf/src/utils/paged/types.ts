export interface PagedOptions {
  rootSelector?: string;

  pageWidth?: string;
  pageHeight?: string;

  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
}

export interface ResolvedPagedOptions {
  rootSelector: string;

  pageWidth: string;
  pageHeight: string;

  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
}

export interface PageLayout {
  sourceClassName: string;
  currentPage: HTMLElement;
  currentContainer: HTMLElement;

  createPage: () => HTMLElement;
  newPage: () => HTMLElement;

  isOverflow: () => boolean;

  tryAppend: <T extends HTMLElement>(node: T) => T | null;
  forceAppend: <T extends HTMLElement>(node: T) => T;
  clone: <T extends HTMLElement>(node: T) => T;
  withContainer: <T>(container: HTMLElement, fn: () => T) => T;
}

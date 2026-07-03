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
  currentContent: HTMLElement;
  createPage: () => HTMLElement;
}

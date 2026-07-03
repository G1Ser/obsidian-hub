const convertMermaidSvgToImg = () => {
  const svgs = Array.from(document.querySelectorAll('svg[id^="mermaid-"]')) as SVGSVGElement[];

  for (const svg of svgs) {
    const clonedSvg = svg.cloneNode(true) as SVGSVGElement;

    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const rect = svg.getBoundingClientRect();

    const width =
      svg.getAttribute('width') && svg.getAttribute('width') !== '100%'
        ? Number.parseFloat(svg.getAttribute('width') || '')
        : rect.width;

    const height =
      svg.getAttribute('height') && svg.getAttribute('height') !== '100%'
        ? Number.parseFloat(svg.getAttribute('height') || '')
        : rect.height;

    if (width) clonedSvg.setAttribute('width', String(width));
    if (height) clonedSvg.setAttribute('height', String(height));

    const svgText = new XMLSerializer().serializeToString(clonedSvg);

    const img = document.createElement('img');

    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';

    if (width) img.width = width;
    if (height) img.height = height;

    svg.replaceWith(img);
  }
};

export const prepareDocument = async () => {
  await document.fonts.ready;
  const win = window as any;
  if (win.mermaid) {
    await win.mermaid.run();
    convertMermaidSvgToImg();
  }
};

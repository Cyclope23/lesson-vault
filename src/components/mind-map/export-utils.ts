/**
 * Convert an SVG element to a PNG Blob via Canvas.
 * @param svgElement The SVG DOM element to capture
 * @param scale      Pixel density multiplier (default 2 for retina)
 */
export async function svgToPngBlob(
  svgElement: SVGSVGElement,
  scale = 2,
): Promise<Blob> {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);

  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);

  const bbox = svgElement.getBBox();
  const viewBox = svgElement.getAttribute("viewBox");
  let width: number, height: number;

  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number);
    width = parts[2];
    height = parts[3];
  } else {
    width = bbox.width + bbox.x;
    height = bbox.height + bbox.y;
  }

  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG image"));
    };
    img.src = url;
  });
}

import { PAGE_SIZES_MM } from "@/contexts/layout/layout-types";
import type {
  PageOrientation,
  PageSettings,
  PageSize,
} from "@/contexts/layout/layout-types";

const MM_PER_INCH = 25.4;

function mmToPx(mm: number, dpi: number): number {
  return (mm / MM_PER_INCH) * dpi;
}

function orient(
  { width, height }: { width: number; height: number },
  orientation: PageOrientation
) {
  return orientation === "portrait" ? { width, height } : { width: height, height: width };
}

function getPageMmSize(size: PageSize, orientation: PageOrientation) {
  return orient(PAGE_SIZES_MM[size], orientation);
}

export function getPagePixelSize(page: PageSettings): { width: number; height: number } {
  const { width, height } = getPageMmSize(page.size, page.orientation);
  return { width: mmToPx(width, page.dpi), height: mmToPx(height, page.dpi) };
}

export const PRINT_PAGE_ID = "print-page";

async function capture(node: HTMLElement, scale: number) {
  const html2canvas = (await import("html2canvas-pro")).default;
  return html2canvas(node, {
    backgroundColor: "#ffffff",
    useCORS: true,
    scale,
    logging: false,
  });
}

async function capturePage(scale: number) {
  const node = document.getElementById(PRINT_PAGE_ID);
  if (!node) throw new Error("Nothing to export — the page canvas is not mounted.");

  const previousTransform = node.style.transform;
  node.style.transform = "none";
  try {
    return await capture(node, scale);
  } finally {
    node.style.transform = previousTransform;
  }
}

export async function exportPageAsPdf(page: PageSettings, scale = 2) {
  const canvas = await capturePage(scale);
  const { width, height } = getPageMmSize(page.size, page.orientation);

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: page.orientation,
    unit: "mm",
    format: [width, height],
  });
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, width, height);
  pdf.save("map-layout.pdf");
}

export async function exportPageAsPng(scale = 2) {
  const canvas = await capturePage(scale);
  const link = document.createElement("a");
  link.download = "map-layout.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

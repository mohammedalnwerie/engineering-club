import { toPng } from 'html-to-image';

/**
 * Exports any DOM element as a high-resolution PNG image and triggers automatic download.
 * @param elementId The HTML ID of the card element to export.
 * @param filename Default file name for download.
 * @param options Optional configuration like pixelRatio or background color.
 */
export async function exportCardAsImage(
  elementId: string,
  filename: string = 'UP-Engineering-Club-Badge.png',
  options?: { pixelRatio?: number; backgroundColor?: string }
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for image export.`);
    return false;
  }

  try {

    // Generate crisp 2x resolution PNG
    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: options?.pixelRatio || 2,
      backgroundColor: options?.backgroundColor || '#080c14',
      filter: (node: Node) => {
        // Exclude elements with data-export-ignore attribute
        if (node instanceof HTMLElement && node.hasAttribute('data-export-ignore')) {
          return false;
        }
        return true;
      },
    });

    const link = document.createElement('a');
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Failed to export card as image:', error);
    return false;
  }
}

/**
 * Triggers standard browser print dialogue for official PDF saving.
 */
export function printCardAsPdf(): void {
  window.print();
}

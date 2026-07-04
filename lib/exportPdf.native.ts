import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Native twin: render the same report HTML to a real PDF file and hand it to the share
// sheet — AirDrop, Save to Files, Mail, WhatsApp to the gestor, or straight to a printer.
export async function exportPdf(html: string): Promise<void> {
  // Real page margins: iOS's HTML→PDF path ignores CSS @page (build-25 QA finding),
  // so ask the renderer for them directly (points; ~13mm). The HTML also carries its
  // own container padding as belt-and-braces for renderers that ignore this too.
  const { uri } = await Print.printToFileAsync({
    html,
    margins: { left: 36, top: 36, right: 36, bottom: 36 },
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Your Get Camino roadmap' });
  } else {
    // No share sheet (rare) — fall back to the print dialog, which can also save to Files.
    await Print.printAsync({ uri });
  }
}

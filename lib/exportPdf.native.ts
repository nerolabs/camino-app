import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Native twin: render the same report HTML to a real PDF file and hand it to the share
// sheet — AirDrop, Save to Files, Mail, WhatsApp to the gestor, or straight to a printer.
export async function exportPdf(html: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Your Camino roadmap' });
  } else {
    // No share sheet (rare) — fall back to the print dialog, which can also save to Files.
    await Print.printAsync({ uri });
  }
}

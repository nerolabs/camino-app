// Web twin: open the report in a new window and hand it to the browser's print dialog —
// every browser's "Save as PDF" does the rest, with zero PDF library shipped to the client.
// Must be called from a user gesture (popup blockers).
export async function exportPdf(html: string): Promise<void> {
  const w = window.open('', '_blank');
  if (!w) throw new Error('Your browser blocked the report window — allow pop-ups and try again.');
  w.document.open();
  w.document.write(html);
  w.document.close();
  // Give fonts/layout a beat before the dialog; printing immediately can render blank.
  w.focus();
  setTimeout(() => w.print(), 300);
}

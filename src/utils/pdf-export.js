import { buildMatrixExportData } from './export-import.js';

export async function exportMatrixPDF(state, metrics, processes, dimensions, defaultMap, presentation = null) {
    const { jsPDF } = await import('jspdf');
    const { autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF('landscape');
    const data = buildMatrixExportData(state, metrics, processes, defaultMap, presentation);
    doc.text('Process-Metric Applicability Matrix', 14, 15);
    doc.setFontSize(9);
    const notes = data.notes.length ? data.notes.join('\n')
        : 'P = Primary Driver, S = Secondary Driver. This allocation map does not show additional minimum-level rules or dependencies.';
    const lines = doc.splitTextToSize(notes, 268);
    doc.text(lines, 14, 22);
    autoTable(doc, {
        startY: 26 + lines.length * 4,
        head: [data.headers],
        body: data.body,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
        columnStyles: { 0: { halign: 'left', cellWidth: 15 }, 1: { halign: 'left', cellWidth: 50 } }
    });
    if (data.conditional.length) autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [['ID', 'Process', 'Metric', 'Role', 'Marker', 'Status', 'Conditional applicability']],
        body: data.conditional,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 6: { cellWidth: 130 } }
    });
    doc.save(`se-tailoring-matrix-${new Date().toISOString().slice(0, 10)}.pdf`);
}
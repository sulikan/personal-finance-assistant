import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportTransactionsToPDF(transactions: any[]) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Laporan Transaksi", 14, 22);

  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(10);
  doc.text(`Tanggal: ${dateStr}`, 14, 30);

  const tableColumn = ["Tanggal", "Deskripsi", "Kategori", "Tipe", "Jumlah"];
  const tableRows = transactions.map((t: any) => [
    new Date(t.date).toLocaleDateString("id-ID"),
    t.description,
    t.category?.name || "-",
    t.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
    { content: t.amount.toLocaleString("id-ID"), styles: { halign: "right" } },
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 38,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 35 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25, halign: "right" },
    },
  });

  doc.save("laporan-transaksi.pdf");
}

export function exportBalanceSheetToPDF(data: {
  assets: number;
  liabilities: number;
  equity: number;
}) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Neraca Keuangan", 14, 22);

  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(10);
  doc.text(`Tanggal: ${dateStr}`, 14, 30);

  autoTable(doc, {
    startY: 38,
    body: [
      [
        { content: "ASET", styles: { fontStyle: "bold", fillColor: [220, 220, 220] } },
        { content: "", styles: { fillColor: [220, 220, 220] } },
      ],
      ["Total Aset", { content: data.assets.toLocaleString("id-ID"), styles: { halign: "right" } }],
      [
        { content: "LIABILITAS", styles: { fontStyle: "bold", fillColor: [220, 220, 220] } },
        { content: "", styles: { fillColor: [220, 220, 220] } },
      ],
      ["Total Liabilitas", { content: data.liabilities.toLocaleString("id-ID"), styles: { halign: "right" } }],
      [
        { content: "EKUITAS", styles: { fontStyle: "bold", fillColor: [220, 220, 220] } },
        { content: "", styles: { fillColor: [220, 220, 220] } },
      ],
      ["Total Ekuitas", { content: data.equity.toLocaleString("id-ID"), styles: { halign: "right" } }],
    ],
    columns: [
      { header: "", dataKey: 0 },
      { header: "", dataKey: 1 },
    ],
    styles: { fontSize: 11 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 40, halign: "right" },
    },
    showHead: false,
  });

  doc.save("neraca-keuangan.pdf");
}

export function exportFinancialSnapshotToPDF(data: {
  totalIncome: number;
  totalExpense: number;
  net: number;
  count: number;
  avgPerDay: number;
  savingsRate: number;
  period: string;
}) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Financial Snapshot", 14, 22);

  doc.setFontSize(10);
  doc.text(`Periode: ${data.period}`, 14, 30);

  autoTable(doc, {
    startY: 38,
    body: [
      [{ content: "METRIK", styles: { fontStyle: "bold", fillColor: [41, 128, 185], textColor: [255, 255, 255] } }, { content: "NILAI", styles: { fontStyle: "bold", fillColor: [41, 128, 185], textColor: [255, 255, 255], halign: "right" } }],
      ["Total Pemasukan", { content: `Rp ${data.totalIncome.toLocaleString("id-ID")}`, styles: { halign: "right" } }],
      ["Total Pengeluaran", { content: `Rp ${data.totalExpense.toLocaleString("id-ID")}`, styles: { halign: "right" } }],
      ["Laba Bersih", { content: `Rp ${data.net.toLocaleString("id-ID")}`, styles: { halign: "right" } }],
      ["Jumlah Transaksi", { content: data.count.toLocaleString("id-ID"), styles: { halign: "right" } }],
      ["Rata-rata per Hari", { content: `Rp ${data.avgPerDay.toLocaleString("id-ID")}`, styles: { halign: "right" } }],
      ["Savings Rate", { content: `${data.savingsRate.toFixed(1)}%`, styles: { halign: "right" } }],
    ],
    columns: [{ header: "", dataKey: 0 }, { header: "", dataKey: 1 }],
    styles: { fontSize: 11 },
    columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 40, halign: "right" } },
    showHead: false,
  });

  doc.save("financial-snapshot.pdf");
}

export function exportCashflowSummaryToPDF(data: {
  rows: { month: string; income: number; expense: number; net: number }[];
  totalIncome: number;
  totalExpense: number;
  totalNet: number;
  period: string;
}) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Cashflow Summary", 14, 22);

  doc.setFontSize(10);
  doc.text(`Periode: ${data.period}`, 14, 30);

  const tableColumn = ["Bulan", "Pemasukan", "Pengeluaran", "Bersih"];
  const tableRows: any[] = data.rows.map((r) => [
    r.month,
    { content: `Rp ${r.income.toLocaleString("id-ID")}`, styles: { halign: "right" } },
    { content: `Rp ${r.expense.toLocaleString("id-ID")}`, styles: { halign: "right" } },
    { content: `Rp ${r.net.toLocaleString("id-ID")}`, styles: { halign: "right" } },
  ]);
  tableRows.push([
    { content: "TOTAL", styles: { fontStyle: "bold" } as any },
    { content: `Rp ${data.totalIncome.toLocaleString("id-ID")}`, styles: { halign: "right", fontStyle: "bold" } as any },
    { content: `Rp ${data.totalExpense.toLocaleString("id-ID")}`, styles: { halign: "right", fontStyle: "bold" } as any },
    { content: `Rp ${data.totalNet.toLocaleString("id-ID")}`, styles: { halign: "right", fontStyle: "bold" } as any },
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 38,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 45, halign: "right" },
      2: { cellWidth: 45, halign: "right" },
      3: { cellWidth: 40, halign: "right" },
    },
  });

  doc.save("cashflow-summary.pdf");
}

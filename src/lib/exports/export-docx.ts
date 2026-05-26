import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";

export async function exportTransactionsToDOCX(transactions: any[], filename: string) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: ["Tanggal", "Deskripsi", "Kategori", "Tipe", "Jumlah"].map(
      (text) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text, bold: true, size: 20, font: "Calibri" }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: 20, type: WidthType.PERCENTAGE },
        })
    ),
  });

  const dataRows = transactions.map(
    (t: any) =>
      new TableRow({
        children: [
          new Date(t.date).toLocaleDateString("id-ID"),
          t.description,
          t.category?.name || "-",
          t.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
          t.amount.toLocaleString("id-ID"),
        ].map(
          (text) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: String(text), size: 18, font: "Calibri" })],
                }),
              ],
            })
        ),
      })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "Laporan Transaksi", bold: true, size: 28, font: "Calibri" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Table({
            rows: [headerRow, ...dataRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}

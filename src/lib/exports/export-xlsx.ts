import * as XLSX from "xlsx";

export function exportTransactionsToXLSX(transactions: any[], filename: string) {
  const data = transactions.map((t: any) => ({
    Tanggal: new Date(t.date).toLocaleDateString("id-ID"),
    Deskripsi: t.description,
    Kategori: t.category?.name || "-",
    Tipe: t.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
    Jumlah: t.amount,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  const colWidths = [
    { wch: 14 },
    { wch: 30 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
  ];
  worksheet["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

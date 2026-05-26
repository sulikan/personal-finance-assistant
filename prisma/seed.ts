import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { hashSync } from "bcryptjs";

const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// ============================================================
// USER DEFINITIONS
// ============================================================

const usersDef = [
  { email: "admin@finance.com",  name: "Admin",    password: "Admin123!", role: "ADMIN" as const },
  { email: "rina@finance.com",   name: "Rina",     password: "User123!",  role: "USER" as const },
  { email: "budi@finance.com",   name: "Budi",     password: "User123!",  role: "USER" as const },
  { email: "sari@finance.com",   name: "Sari",     password: "User123!",  role: "USER" as const },
  { email: "doni@finance.com",   name: "Doni",     password: "User123!",  role: "USER" as const },
];

// ============================================================
// TRANSACTION DEFINITIONS (category names + type)
// ============================================================

const incomeSubCatDefs = [
  { name: "Gaji",      description: "Gaji bulanan" },
  { name: "Freelance", description: "Pendapatan freelance" },
  { name: "Bonus",     description: "Bonus & THR" },
  { name: "Investasi", description: "Hasil investasi" },
];

const expenseSubCatDefs = [
  { name: "Makanan",       description: "Makan & minum" },
  { name: "Transportasi",  description: "Biaya transportasi" },
  { name: "Belanja",       description: "Belanja bulanan" },
  { name: "Hiburan",       description: "Hiburan & rekreasi" },
  { name: "Kesehatan",     description: "Biaya kesehatan" },
  { name: "Tagihan",       description: "Listrik, air, internet" },
  { name: "Hutang",        description: "Pembayaran hutang" },
  { name: "Investasi",     description: "Tabungan & investasi" },
];

const walletDefs = [
  { name: "Dompet Cash", type: "CASH" as const,     description: "Uang tunai harian" },
  { name: "BCA",         type: "BANK" as const,      description: "Rekening utama" },
  { name: "GoPay",       type: "E_WALLET" as const,  description: "Dompet digital" },
];

// ============================================================
// DESCRIPTIONS FOR RANDOM TRANSACTIONS
// ============================================================

const foodDescs = [
  "Makan siang", "Makan malam", "Sarapan", "Nasi padang", "Bakso", "Sate", "Ayam geprek",
  "Mie ayam", "Pecel lele", "Soto", "Rendang", "Gudeg", "Rawon", "Seblak", "Martabak",
  "Es krim", "Boba tea", "Kopi susu", "Jus buah", "Camilan",
];
const transportDescs = [
  "Bensin motor", "Toll", "Parkir", "Gojek", "Grab", "Taxi", "Bis kota", "MRT", "KRL", "Angkot",
  "Servis motor", "Ganti oli",
];
const shoppingDescs = [
  "Belanja bulanan", "Sembako", "Bumbu dapur", "Sabun & shampoo", "Pembersih rumah",
  "Pakaian", "Sepatu", "Tas", "Aksesoris",
];
const entertainmentDescs = [
  "Netflix", "Spotify", "Bioskop", "Konser", "Game online", "Nonton bola", "Karaoke",
];
const healthDescs = [
  "Vitamin", "Obat batuk", "Cek dokter", "Konsultasi gigi", "Masker", "Suplemen",
];
const billDescs = [
  "Listrik PLN", "PDAM", "IndiHome", "Token listrik", "Pulsa", "Paket data",
];
const debtDescs = [
  "Cicilan motor", "Kartu kredit", "Pinjaman", "Cicilan rumah",
];
const investDescs = [
  "Tabungan bulanan", "Beli reksadana", "Dana pensiun", "Emas batangan",
];

const freelanceDescs = [
  "Project website", "Desain grafis", "Aplikasi mobile", "Konsultasi IT",
  "Penulisan konten", "Fotografi", "Video editing",
];

const investIncomeDescs = [
  "Dividen saham", "Reksadana", "Bunga deposito", "Bunga tabungan",
];

// ============================================================
// MAIN SEED
// ============================================================

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clean existing data
  await prisma.transactionLine.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();
  console.log("  🧹 Data lama dibersihkan\n");

  const totalStart = Date.now();

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // # of months from Jan 2025 to May 2026
  const START_YEAR = 2025;
  const START_MONTH = 0; // January
  const END_YEAR = 2026;
  const END_MONTH = 4; // May

  interface CatInfo {
    incomeParent: string;
    expenseParent: string;
    incomeSubs: string[];
    expenseSubs: string[];
  }

  async function setupUser(
    email: string,
    name: string,
    password: string,
    role: string,
  ): Promise<{ userId: string; cats: CatInfo; wallets: string[] }> {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, password, role: role as any },
    });

    // Categories
    const incomeParent = await prisma.category.create({
      data: { userId: user.id, name: "Pemasukan", type: "INCOME", description: "Semua pemasukan" },
    });
    const incomeSubs: string[] = [];
    for (const def of incomeSubCatDefs) {
      const c = await prisma.category.create({
        data: { userId: user.id, name: def.name, type: "INCOME", parentId: incomeParent.id, description: def.description },
      });
      incomeSubs.push(c.id);
    }

    const expenseParent = await prisma.category.create({
      data: { userId: user.id, name: "Pengeluaran", type: "EXPENSE", description: "Semua pengeluaran" },
    });
    const expenseSubs: string[] = [];
    for (const def of expenseSubCatDefs) {
      const c = await prisma.category.create({
        data: { userId: user.id, name: def.name, type: "EXPENSE", parentId: expenseParent.id, description: def.description },
      });
      expenseSubs.push(c.id);
    }

    // Wallets
    const wallets: string[] = [];
    for (const def of walletDefs) {
      const w = await prisma.wallet.create({
        data: { userId: user.id, name: def.name, type: def.type as any, balance: 0, description: def.description },
      });
      wallets.push(w.id);
    }

    return {
      userId: user.id,
      cats: {
        incomeParent: incomeParent.id,
        expenseParent: expenseParent.id,
        incomeSubs,
        expenseSubs,
      },
      wallets,
    };
  }

  const userInfos: { userId: string; cats: CatInfo; wallets: string[] }[] = [];
  for (const u of usersDef) {
    const pwHash = hashSync(u.password, 12);
    const info = await setupUser(u.email, u.name, pwHash, u.role);
    userInfos.push(info);
    console.log(`  ✅ User: ${u.name} (${u.email}) [${u.role}]`);
  }

  // ============================================================
  // GENERATE TRANSACTIONS
  // ============================================================

  interface TxDef {
    date: Date;
    desc: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    catId: string;
    walletId: string;
    userId: string;
  }

  const allTxns: TxDef[] = [];

  function randomDate(year: number, month: number): Date {
    const maxDay = daysInMonth(year, month);
    return new Date(year, month, randomInt(1, maxDay));
  }

  // For each user, generate transactions across the full date range
  for (let ui = 0; ui < userInfos.length; ui++) {
    const { userId, cats, wallets } = userInfos[ui];
    const isAdmin = ui === 0;
    const userName = usersDef[ui].name;

    let userTxCount = 0;
    const userStart = Date.now();

    const [gajiId, freelanceId, bonusId, investIncomeId] = cats.incomeSubs;
    const [makananId, transportasiId, belanjaId, hiburanId, kesehatanId, tagihanId, hutangId, investExpenseId] = cats.expenseSubs;
    const [cashId, bankId, ewalletId] = wallets;

    // Walk through each month in the range
    let year = START_YEAR;
    let month = START_MONTH;
    while (year < END_YEAR || (year === END_YEAR && month <= END_MONTH)) {
      const monthName = monthNames[month];
      const inScope = year === END_YEAR && month === END_MONTH;
      const lastDay = inScope ? 24 : daysInMonth(year, month);

      // --- INCOME ---

      // Salary on 25th (for admin only - full salary, rina gets half, others get freelance style)
      const salaryAmount = isAdmin ? 7500000 + (month === 2 && year === 2026 ? 7500000 : 0) : 0;
      if (salaryAmount > 0 && lastDay >= 25) {
        allTxns.push({
          date: new Date(year, month, 25),
          desc: month === 2 && year === 2026 ? "Gaji + THR" : `Gaji ${monthName} ${year}`,
          amount: salaryAmount,
          type: "INCOME",
          catId: gajiId,
          walletId: bankId,
          userId,
        });
        userTxCount++;
      }

      // Rina gets a regular income (smaller salary)
      if (!isAdmin && ui === 1 && lastDay >= 27) {
        allTxns.push({
          date: new Date(year, month, 27),
          desc: `Gaji ${monthName} ${year}`,
          amount: randomInt(4000000, 5500000),
          type: "INCOME",
          catId: gajiId,
          walletId: bankId,
          userId,
        });
        userTxCount++;
      }

      // Freelance / side income (all users)
      if (randomInt(1, 3) === 1) {
        allTxns.push({
          date: randomDate(year, month),
          desc: pick(freelanceDescs),
          amount: randomInt(500000, 3000000),
          type: "INCOME",
          catId: freelanceId,
          walletId: pick([bankId, ewalletId]),
          userId,
        });
        userTxCount++;
      }

      // Bonus (occasional)
      if (randomInt(1, 4) === 1) {
        allTxns.push({
          date: randomDate(year, month),
          desc: pick(["Bonus project", "Bonus akhir tahun", "THR", "Insentif"]),
          amount: randomInt(500000, 2000000),
          type: "INCOME",
          catId: bonusId,
          walletId: bankId,
          userId,
        });
        userTxCount++;
      }

      // Investment income
      if (randomInt(1, 3) === 1) {
        allTxns.push({
          date: randomDate(year, month),
          desc: pick(investIncomeDescs),
          amount: randomInt(100000, 500000),
          type: "INCOME",
          catId: investIncomeId,
          walletId: bankId,
          userId,
        });
        userTxCount++;
      }

      // --- EXPENSES ---

      // Bills (around 5-12th)
      const billDay = randomInt(5, 10);
      if (billDay <= lastDay) {
        allTxns.push({
          date: new Date(year, month, billDay),
          desc: `Listrik PLN ${monthName} ${year}`,
          amount: randomInt(200000, 450000),
          type: "EXPENSE",
          catId: tagihanId,
          walletId: bankId,
          userId,
        });
        userTxCount++;

        if (billDay + 1 <= lastDay) {
          allTxns.push({
            date: new Date(year, month, billDay + 1),
            desc: isAdmin ? `IndiHome ${monthName}` : `Internet ${monthName}`,
          amount: isAdmin ? 320000 : randomInt(150000, 300000),
          type: "EXPENSE",
          catId: tagihanId,
          walletId: bankId,
          userId,
        });
        userTxCount++;
        }
      }

      if (randomInt(1, 2) === 1) {
        allTxns.push({
          date: randomDate(year, month),
          desc: pick(["Pulsa", "Paket data", "Token listrik"]),
          amount: randomInt(50000, 200000),
          type: "EXPENSE",
          catId: tagihanId,
          walletId: pick([ewalletId, cashId]),
          userId,
        });
        userTxCount++;
      }

      // Debt payments
      if (month % 2 === 0 || isAdmin) {
        allTxns.push({
          date: new Date(year, month, randomInt(5, 10)),
          desc: pick(["Cicilan motor", "Cicilan rumah", "Pinjaman"]),
          amount: randomInt(500000, 1000000),
          type: "EXPENSE",
          catId: hutangId,
          walletId: bankId,
          userId,
        });
        userTxCount++;
      }

      // Credit card
      if (randomInt(1, 2) === 1) {
        allTxns.push({
          date: new Date(year, month, randomInt(12, 18)),
          desc: "Kartu kredit",
          amount: randomInt(300000, 1200000),
          type: "EXPENSE",
          catId: hutangId,
          walletId: bankId,
          userId,
        });
        userTxCount++;
      }

      // Investment/savings
      allTxns.push({
        date: new Date(year, month, randomInt(20, 28)),
        desc: pick(investDescs),
        amount: randomInt(300000, 1000000),
        type: "EXPENSE",
        catId: investExpenseId,
        walletId: bankId,
        userId,
      });
      userTxCount++;

      // Food - multiple times per month
      const foodCount = randomInt(6, 14);
      for (let f = 0; f < foodCount; f++) {
        const day = randomInt(1, lastDay);
        allTxns.push({
          date: new Date(year, month, day),
          desc: pick(foodDescs),
          amount: pick([20000, 25000, 30000, 35000, 45000, 50000, 65000, 80000]),
          type: "EXPENSE",
          catId: makananId,
          walletId: pick([cashId, ewalletId]),
          userId,
        });
        userTxCount++;
      }

      // Transport - 4-8 times per month
      const transCount = randomInt(4, 8);
      for (let t = 0; t < transCount; t++) {
        const day = randomInt(1, lastDay);
        allTxns.push({
          date: new Date(year, month, day),
          desc: pick(transportDescs),
          amount: t % 3 === 0 ? pick([70000, 100000, 120000]) : pick([10000, 15000, 20000, 30000, 50000]),
          type: "EXPENSE",
          catId: transportasiId,
          walletId: cashId,
          userId,
        });
        userTxCount++;
      }

      // Shopping - 2-4 times per month
      const shopCount = randomInt(2, 4);
      for (let s = 0; s < shopCount; s++) {
        const day = randomInt(1, lastDay);
        allTxns.push({
          date: new Date(year, month, day),
          desc: pick(shoppingDescs),
          amount: pick([100000, 150000, 200000, 300000, 500000, 750000]),
          type: "EXPENSE",
          catId: belanjaId,
          walletId: bankId,
          userId,
        });
        userTxCount++;
      }

      // Entertainment - 1-3 per month
      const entCount = randomInt(1, 3);
      for (let e = 0; e < entCount; e++) {
        const day = randomInt(1, lastDay);
        allTxns.push({
          date: new Date(year, month, day),
          desc: pick(entertainmentDescs),
          amount: pick([50000, 100000, 150000, 200000]),
          type: "EXPENSE",
          catId: hiburanId,
          walletId: pick([ewalletId, bankId]),
          userId,
        });
        userTxCount++;
      }

      // Health - 1 per 2 months
      if (month % 2 === 0) {
        allTxns.push({
          date: randomDate(year, month),
          desc: pick(healthDescs),
          amount: pick([50000, 100000, 150000, 200000, 300000]),
          type: "EXPENSE",
          catId: kesehatanId,
          walletId: cashId,
          userId,
        });
        userTxCount++;
      }

      // Move to next month
      month++;
      if (month > 11) { month = 0; year++; }
    }

    const elapsed = ((Date.now() - userStart) / 1000).toFixed(1);
    console.log(`  📊 ${userName}: ${userTxCount} transaksi (${elapsed}s)`);
  }

  // Sort by date
  allTxns.sort((a, b) => a.date.getTime() - b.date.getTime());

  console.log(`\n📦 Total ${allTxns.length} transaksi akan di-generate...`);

  // Execute transactions
  let txProcessed = 0;
  const batchStart = Date.now();

  for (const tx of allTxns) {
    await prisma.transaction.create({
      data: {
        userId: tx.userId,
        description: tx.desc,
        amount: tx.amount,
        type: tx.type,
        date: tx.date,
        categoryId: tx.catId,
        lines: {
          create: {
            walletId: tx.walletId,
            entryType: tx.type === "INCOME" ? "CREDIT" : "DEBIT",
            amount: tx.amount,
            accountType: tx.type === "INCOME" ? "INCOME" : "EXPENSE",
          },
        },
      },
    });

    const balanceChange = tx.type === "INCOME" ? tx.amount : -tx.amount;
    await prisma.wallet.update({
      where: { id: tx.walletId },
      data: { balance: { increment: balanceChange } },
    });

    txProcessed++;
    if (txProcessed % 50 === 0) {
      console.log(`  🔄 ${txProcessed}/${allTxns.length} transaksi...`);
    }
  }

  const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(1);

  // Summary
  const totalIncome = allTxns.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = allTxns.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  console.log(`\n✅ Seed selesai! (${totalElapsed}s)`);
  console.log(`   Total pemasukan:  Rp ${totalIncome.toLocaleString("id-ID")}`);
  console.log(`   Total pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}`);
  console.log(`   Saldo bersih:      Rp ${(totalIncome - totalExpense).toLocaleString("id-ID")}`);
  console.log(`   Total transaksi:   ${allTxns.length}`);
  console.log(`   Users:             ${userInfos.length}`);
  console.log(`\n🔑 Akun:`);
  for (const u of usersDef) {
    console.log(`   ${u.name.padEnd(15)} ${u.email.padEnd(25)} ${u.password}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

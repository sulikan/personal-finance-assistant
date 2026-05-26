import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  captchaId: z.string().min(1),
  captchaAnswer: z.string().length(8, "CAPTCHA harus 8 karakter"),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  type: z.enum(["INCOME", "EXPENSE"]),
  parentId: z.string().nullable().optional(),
  description: z.string().max(500).default(""),
});

export const walletSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  type: z.enum(["CASH", "BANK", "E_WALLET"]),
  description: z.string().max(500).default(""),
  balance: z.number().default(0),
});

export const transactionSchema = z.object({
  description: z.string().min(1, "Deskripsi wajib diisi").max(500),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  type: z.enum(["INCOME", "EXPENSE"]),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Tanggal tidak valid"),
  categoryId: z.string().min(1, "Kategori wajib diisi"),
  walletId: z.string().min(1, "Akun/Dompet wajib diisi"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type WalletInput = z.infer<typeof walletSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;

import type { Prisma, PrismaClient } from "@bazaara/db";

export type JournalLine = {
  accountId: string;
  direction: "DEBIT" | "CREDIT";
  amountMinor: bigint;
};

export type Journal = {
  reference: string;
  kind: string;
  currency: string;
  description?: string;
  lines: readonly JournalLine[];
};

export function validateJournal(journal: Journal): void {
  if (!/^[A-Z]{3}$/.test(journal.currency)) throw new Error("Invalid currency");
  if (journal.lines.length < 2) throw new Error("A journal needs at least two lines");
  let debit = 0n;
  let credit = 0n;
  for (const line of journal.lines) {
    if (line.amountMinor <= 0n) throw new Error("Ledger amounts must be positive minor units");
    if (line.direction === "DEBIT") debit += line.amountMinor;
    else credit += line.amountMinor;
  }
  if (debit !== credit) throw new Error(`Unbalanced journal: debit=${debit}, credit=${credit}`);
}

export async function postJournal(
  tx: Prisma.TransactionClient | PrismaClient,
  journal: Journal,
) {
  validateJournal(journal);
  return tx.ledgerTransaction.create({
    data: {
      reference: journal.reference,
      kind: journal.kind,
      currency: journal.currency,
      description: journal.description,
      entries: {
        create: journal.lines.map((line) => ({
          accountId: line.accountId,
          direction: line.direction,
          amountMinor: line.amountMinor,
        })),
      },
    },
    include: { entries: true },
  });
}

/** Pure domain rules. Never use email, phone or display name as a conversation identifier. */
export function directKey(a: string, b: string): string {
  if (!a || !b || a === b) throw new Error("A direct conversation needs two different users");
  return [a, b].sort().map((part) => `${part.length}:${part}`).join("|");
}

const reserved = new Set(["admin", "support", "system", "bazaara", "bazid", "moderator", "root", "official", "help", "staff", "security", "safety", "bazchat", "bazclips", "baztune", "bazforum", "bazcircle", "bazcut", "bazsend"]);
export function normalizeHandle(value: string): string {
  const handle = value.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z][a-z0-9_]{2,29}$/.test(handle) || reserved.has(handle)) {
    throw new Error("Use 3–30 characters starting with a letter; only letters, numbers and underscores are allowed");
  }
  return handle;
}

export function cursorAfter(createdAt: Date, id: string) {
  return { OR: [{ createdAt: { gt: createdAt } }, { createdAt, id: { gt: id } }] };
}
export function cursorBefore(createdAt: Date, id: string) {
  return { OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: id } }] };
}

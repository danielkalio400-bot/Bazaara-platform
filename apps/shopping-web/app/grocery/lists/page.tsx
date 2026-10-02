import { redirect } from "next/navigation";

const GROCERY = (process.env.NEXT_PUBLIC_GROCERY_WEB_BASE_URL ?? "http://localhost:3006").replace(/\/$/, "");

export default function GroceryListsRedirect() {
  redirect(`${GROCERY}/lists`);
}

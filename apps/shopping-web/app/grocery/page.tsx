import { redirect } from "next/navigation";

const GROCERY = process.env.NEXT_PUBLIC_GROCERY_WEB_BASE_URL ?? "http://localhost:3006";

export default function GroceryAppRedirect() {
  redirect(GROCERY);
}

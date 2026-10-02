import {
  proxyCartRequest
} from "./proxy";

export const dynamic =
  "force-dynamic";

export async function GET(
  request: Request
) {
  return proxyCartRequest(
    request,
    "/v1/grocery/cart"
  );
}

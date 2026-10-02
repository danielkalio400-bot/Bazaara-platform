import {
  proxyCartRequest
} from "../proxy";

export const dynamic =
  "force-dynamic";

export async function POST(
  request: Request
) {
  return proxyCartRequest(
    request,
    "/v1/shopping/cart/items"
  );
}

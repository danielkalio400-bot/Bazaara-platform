import {
  proxyCartRequest
} from "../../proxy";

export const dynamic =
  "force-dynamic";

type Context = {
  params:
    Promise<{
      itemId: string;
    }>;
};

export async function PATCH(
  request: Request,
  context: Context
) {
  const {
    itemId
  } =
    await context.params;

  return proxyCartRequest(
    request,
    `/v1/shopping/cart/items/${encodeURIComponent(itemId)}`
  );
}

export async function DELETE(
  request: Request,
  context: Context
) {
  const {
    itemId
  } =
    await context.params;

  return proxyCartRequest(
    request,
    `/v1/shopping/cart/items/${encodeURIComponent(itemId)}`
  );
}

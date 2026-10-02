import { Suspense } from "react";

import { BazAiWebAssistant } from "../../components/bazai-web-assistant";

export default function BazAiShoppingPage() {
  return (
    <Suspense fallback={null}>
      <BazAiWebAssistant />
    </Suspense>
  );
}

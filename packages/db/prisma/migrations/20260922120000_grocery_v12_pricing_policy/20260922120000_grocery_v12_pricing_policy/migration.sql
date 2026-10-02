-- Change the current NG Grocery default from legacy 10–15% to 20%.
-- No historic ShoppingOrder or ShoppingCheckout amounts are rewritten.
UPDATE "RegionalConfig"
SET "rules" = jsonb_set(COALESCE("rules", '{}'::jsonb), '{serviceFeeBps}', '2000'::jsonb, true),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "region" = 'NG' AND "vertical" = 'GROCERY'
  AND ("rules"->>'serviceFeeBps')::integer BETWEEN 1000 AND 1500;

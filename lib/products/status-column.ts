/**
 * Product visibility column on `public.products`.
 * Legacy databases use `approval_status`; after migration 20260626140000
 * this is renamed to `status`.
 */
export const PRODUCT_STATUS_COLUMN = "approval_status" as const;

export const PRODUCT_STATUS_APPROVED = "approved" as const;

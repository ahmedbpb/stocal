export const USER_ROLES = [
  "customer",
  "local_brand",
  "stock_seller",
  "super_admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type AdminUser = {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
};

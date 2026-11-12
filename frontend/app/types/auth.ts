export type Role = "CUSTOMER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  createdAt: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  area: string | null;
  city: string;
  postalCode: string | null;
  isDefault: boolean;
}

export interface AdminCustomerListItem {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  createdAt: string;
  isActive: boolean;
  orderCount: number;
}

export interface AdminCustomerDetail {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  createdAt: string;
  isActive: boolean;
  addresses: Address[];
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    createdAt: string;
  }>;
}

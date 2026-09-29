export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Customer' | 'Vendor' | 'Admin';
  vendorId: string | null;
}
export interface Product {
  id: string;
  vendorId: string;
  vendorEn: string;
  vendorAr: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  category: string;
  image: string;
  price: number;
  stock: number;
  active: boolean;
  version: number;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface CartItem {
  product: Product;
  quantity: number;
}
export interface OrderItem {
  id: string;
  productId: string;
  nameEn: string;
  nameAr: string;
  image: string;
  quantity: number;
  unitPrice: number;
  status: string;
  version: number;
}
export interface Order {
  id: string;
  number: string;
  createdAt: string;
  recipient: string;
  phone: string;
  address: string;
  city: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentStatus: string;
  paymentProvider: string;
  items: OrderItem[];
}
export interface VendorOrder extends OrderItem {
  orderId: string;
  number: string;
  createdAt: string;
  recipient: string;
  city: string;
  address: string;
  phone: string;
}
export interface Dashboard {
  revenue: number;
  orders: number;
  products: number;
  lowStock: number;
  pending: number;
  series: { date: string; amount: number }[];
  topProducts: {
    nameEn: string;
    nameAr: string;
    stock: number;
    image: string;
  }[];
}
export interface AdminOverview {
  customers: number;
  orders: number;
  revenue: number;
  vendors: {
    id: string;
    nameEn: string;
    nameAr: string;
    city: string;
    approved: boolean;
  }[];
  audit: { id: number; action: string; detail: string; createdAt: string }[];
}

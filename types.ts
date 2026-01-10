
export interface Sandwich {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'Frango' | 'Carne' | 'Veggie' | 'Peixe';
  ingredients: string[];
}

export interface CartItem extends Sandwich {
  quantity: number;
}

export interface CustomerInfo {
  storeName: string;
  customerName: string;
  street: string;
  number: string;
  referencePoint: string;
}

export interface Order {
  id: string;
  customer: CustomerInfo;
  items: CartItem[];
  total: number;
  date: string;
  status: 'Pendente' | 'Preparando' | 'Enviado' | 'Entregue';
}

export type AppView = 'menu' | 'cart' | 'checkout' | 'success' | 'admin';

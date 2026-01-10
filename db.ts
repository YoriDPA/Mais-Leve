
import { Sandwich, Order } from './types';
import { SANDWICHES as INITIAL_SANDWICHES } from './constants';

export class MaisLeveLocalDB {
  private readonly PRODUCTS_KEY = 'ml_products';
  private readonly ORDERS_KEY = 'ml_orders';

  async getProducts(): Promise<Sandwich[]> {
    const stored = localStorage.getItem(this.PRODUCTS_KEY);
    if (!stored) {
      this.saveAllProducts(INITIAL_SANDWICHES);
      return INITIAL_SANDWICHES;
    }
    return JSON.parse(stored);
  }

  async saveProduct(product: Sandwich): Promise<void> {
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
  }

  async saveAllProducts(products: Sandwich[]): Promise<void> {
    localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
  }

  async addOrder(order: Order): Promise<string> {
    const orders = this.getStoredOrders();
    const newOrder = {
      ...order,
      createdAt: new Date().toISOString()
    };
    orders.unshift(newOrder);
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
    
    // Dispara um evento customizado para notificar mudanças locais (simulando subscription)
    window.dispatchEvent(new Event('ml_orders_updated'));
    return order.id;
  }

  private getStoredOrders(): any[] {
    const stored = localStorage.getItem(this.ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const orders = this.getStoredOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index >= 0) {
      orders[index].status = status;
      localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
      window.dispatchEvent(new Event('ml_orders_updated'));
    }
  }

  subscribeToOrders(callback: (orders: Order[]) => void) {
    const handler = () => {
      callback(this.getStoredOrders());
    };
    window.addEventListener('ml_orders_updated', handler);
    // Chamada inicial
    handler();
    return () => window.removeEventListener('ml_orders_updated', handler);
  }

  subscribeToProducts(callback: (products: Sandwich[]) => void) {
    const handler = () => {
      this.getProducts().then(callback);
    };
    window.addEventListener('storage', (e) => {
      if (e.key === this.PRODUCTS_KEY) handler();
    });
    // Chamada inicial
    handler();
    return () => {};
  }
}

export const dbService = new MaisLeveLocalDB();

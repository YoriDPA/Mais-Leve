
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ShoppingCart, MapPin, ChevronLeft, CheckCircle2, 
  Plus, Minus, Trash2, Send, Settings, Package, LayoutGrid, 
  Edit3, Save, X, ExternalLink, Clock, Loader2, Sparkles, Check,
  Search, Filter, PlusCircle, BrainCircuit, Wand2, ShoppingBag, ArrowRight, Bell, BellRing, WifiOff, Download
} from 'lucide-react';
import { Sandwich, CartItem, CustomerInfo, AppView, Order } from './types';
import { SANDWICHES as INITIAL_SANDWICHES } from './constants';
import { dbService } from './db';
import { getSandwichRecommendation } from './geminiService';

const Logo: React.FC = () => (
  <div className="flex items-center gap-3">
    <div className="grid grid-cols-2 gap-[2px] w-10 h-10 shrink-0">
      <div className="bg-brand-orange rounded-sm"></div>
      <div className="bg-brand-lightGreen rounded-sm"></div>
      <div className="bg-brand-paleGreen rounded-sm"></div>
      <div className="bg-brand-red rounded-sm"></div>
    </div>
    <div className="flex flex-col leading-none">
      <div className="flex font-black text-2xl tracking-tighter">
        <span className="text-white">MAIS</span>
        <span className="text-brand-lightGreen">LEVE</span>
      </div>
      <span className="text-[9px] font-bold tracking-[0.3em] text-gray-400 mt-0.5 uppercase">ALIMENTOS</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('menu');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [addedId, setAddedId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{sandwichId: string, justification: string} | null>(null);

  const [customer, setCustomer] = useState<CustomerInfo>({
    storeName: localStorage.getItem('ml_storeName') || '',
    customerName: localStorage.getItem('ml_customerName') || '',
    street: localStorage.getItem('ml_street') || '',
    number: localStorage.getItem('ml_number') || '',
    referencePoint: localStorage.getItem('ml_ref') || ''
  });

  const [sandwiches, setSandwiches] = useState<Sandwich[]>(INITIAL_SANDWICHES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminTab, setAdminTab] = useState<'pedidos' | 'produtos'>('pedidos');
  
  const [newOrderToast, setNewOrderToast] = useState<Order | null>(null);
  const prevOrdersCount = useRef<number>(0);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const playNotificationSound = () => {
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContext.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Som bloqueado pelo navegador.");
    }
  };

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;
    let unsubscribeProducts: (() => void) | undefined;

    const initFirebaseData = async () => {
      try {
        const currentProducts = await dbService.getProducts();
        if (currentProducts.length === 0) {
          await dbService.saveAllProducts(INITIAL_SANDWICHES);
        }

        unsubscribeProducts = dbService.subscribeToProducts((updatedProducts) => {
          if (updatedProducts.length > 0) setSandwiches(updatedProducts);
          setLoading(false);
        });

        unsubscribeOrders = dbService.subscribeToOrders((updatedOrders) => {
          if (updatedOrders.length > prevOrdersCount.current && prevOrdersCount.current !== 0) {
            const newest = updatedOrders[0];
            setNewOrderToast(newest);
            playNotificationSound();
            setTimeout(() => setNewOrderToast(null), 5000);
          }
          prevOrdersCount.current = updatedOrders.length;
          setOrders(updatedOrders);
        });
      } catch (error) {
        setLoading(false);
      }
    };

    initFirebaseData();
    return () => {
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeProducts) unsubscribeProducts();
    };
  }, []);

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  const addToCart = (sandwich: Sandwich) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === sandwich.id);
      if (existing) {
        return prev.map(item => item.id === sandwich.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...sandwich, quantity: 1 }];
    });
    setAddedId(sandwich.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const filteredSandwiches = useMemo(() => {
    return sandwiches.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'Todos' || s.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [sandwiches, searchQuery, activeCategory]);

  const handleAiRecommendation = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    const result = await getSandwichRecommendation(aiInput);
    setAiResult(result);
    setAiLoading(false);
  };

  const handleCompleteOrder = async (orderId: string) => {
    await dbService.updateOrderStatus(orderId, 'Entregue');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const generateWhatsAppMessage = (order?: Order) => {
    const targetOrder = order || { id: 'NOVO', items: cart, customer, total: cartTotal };
    const items = targetOrder.items.map(i => `${i.quantity}x ${i.name} - R$ ${(i.price * i.quantity).toFixed(2)}`).join('%0A');
    const msg = `*Pedido #${targetOrder.id} - Mais Leve*%0A%0A` +
      `*Cliente:* ${targetOrder.customer.customerName}%0A` +
      `*Endereço:* ${targetOrder.customer.street}, ${targetOrder.customer.number}%0A%0A` +
      `*Itens:*%0A${items}%0A%0A` +
      `*Total: R$ ${targetOrder.total.toFixed(2)}*`;
    return `https://wa.me/5500000000000?text=${msg}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg p-6">
        <Logo />
        <div className="mt-8 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-darkGreen" size={32} />
          <p className="text-brand-darkGreen font-bold animate-pulse">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text">
      {/* Offline Alert */}
      {!isOnline && (
        <div className="bg-brand-red text-white text-[10px] font-black py-1 px-4 text-center sticky top-0 z-[60] flex items-center justify-center gap-2">
          <WifiOff size={12} /> MODO OFFLINE - RECURSOS LIMITADOS
        </div>
      )}

      {/* New Order Toast */}
      {newOrderToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm animate-in slide-in-from-top-10 fade-in duration-300">
          <div className="bg-brand-surface text-white p-5 rounded-3xl shadow-2xl flex items-center gap-4 border border-brand-darkGreen/50">
            <div className="bg-brand-darkGreen/20 p-2 rounded-full">
              <BellRing className="text-brand-darkGreen animate-bounce" size={24} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-darkGreen">Novo Pedido!</p>
              <p className="font-bold text-sm truncate">{newOrderToast.customer.customerName}</p>
            </div>
            <button 
              onClick={() => { setView('admin'); setAdminTab('pedidos'); setNewOrderToast(null); }}
              className="bg-brand-darkGreen text-white px-4 py-2 rounded-xl font-black text-[10px]"
            >
              VER
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-brand-bg/80 backdrop-blur-xl border-b border-brand-border px-6 py-4 flex items-center justify-between shadow-lg safe-top">
        <div className="cursor-pointer active:scale-95 transition-transform" onClick={() => setView('menu')}>
          <Logo />
        </div>
        
        <div className="flex items-center gap-2">
          {deferredPrompt && (
            <button onClick={handleInstallClick} className="p-3 bg-brand-orange/10 text-brand-orange rounded-full">
              <Download size={20} />
            </button>
          )}
          {view === 'menu' && (
            <button onClick={() => setShowAiModal(true)} className="p-3 bg-brand-darkGreen/10 text-brand-darkGreen rounded-full">
              <Sparkles size={20} className="animate-pulse" />
            </button>
          )}
          <button 
            onClick={() => setView(view === 'admin' ? 'menu' : 'admin')}
            className={`p-3 rounded-full transition-all ${view === 'admin' ? 'bg-brand-darkGreen text-white' : 'bg-brand-surface text-gray-400'}`}
          >
            {view === 'admin' ? <LayoutGrid size={20} /> : <Settings size={20} />}
          </button>
          {view !== 'cart' && (
            <button onClick={() => setView('cart')} className="relative p-3 bg-white text-black rounded-full shadow-lg">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-brand-bg">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 lg:p-8 safe-bottom">
        {view === 'menu' && (
          <section className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-6">
              <div className="relative group max-w-2xl mx-auto w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-darkGreen" size={20} />
                <input 
                  type="text" 
                  placeholder="Qual seu sanduíche hoje?" 
                  className="w-full bg-brand-surface border-2 border-brand-border focus:border-brand-darkGreen rounded-2xl py-4 pl-14 pr-6 outline-none font-bold text-sm text-white transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                {['Todos', 'Frango', 'Carne', 'Veggie', 'Peixe'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-brand-darkGreen text-white shadow-lg' : 'bg-brand-surface text-gray-400 border border-brand-border'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
              {filteredSandwiches.map((sandwich) => (
                <div key={sandwich.id} className="bg-brand-surface rounded-[2rem] overflow-hidden border border-brand-border hover:border-brand-darkGreen/50 transition-all group flex flex-col">
                  <div className="h-48 overflow-hidden relative">
                    <img src={sandwich.image} alt={sandwich.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-surface/80 to-transparent"></div>
                    <span className="absolute top-4 left-4 bg-brand-darkGreen px-3 py-1 rounded-full text-[9px] font-black uppercase text-white">
                      {sandwich.category}
                    </span>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-extrabold text-white leading-tight pr-2">{sandwich.name}</h3>
                      <span className="font-black text-brand-darkGreen">R$ {sandwich.price.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-6 font-medium line-clamp-2 flex-1">{sandwich.description}</p>
                    <button 
                      onClick={() => addToCart(sandwich)}
                      disabled={addedId === sandwich.id}
                      className={`w-full py-4 rounded-xl font-black text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${addedId === sandwich.id ? 'bg-brand-lightGreen text-white' : 'bg-white text-black hover:bg-brand-darkGreen hover:text-white active:scale-95'}`}
                    >
                      {addedId === sandwich.id ? <Check size={16} /> : <Plus size={16} />} 
                      {addedId === sandwich.id ? 'ADICIONADO' : 'ADICIONAR'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'cart' && (
          <section className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4 mb-10">
              <button onClick={() => setView('menu')} className="p-2 bg-brand-surface rounded-full text-white"><ChevronLeft size={24} /></button>
              <h2 className="text-2xl font-black text-white uppercase">Sua Cesta</h2>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-brand-surface p-10 rounded-full inline-block mb-6"><ShoppingBag size={48} className="text-brand-border" /></div>
                <h3 className="text-xl font-black text-white mb-8">Vazia no momento</h3>
                <button onClick={() => setView('menu')} className="bg-brand-darkGreen text-white px-10 py-4 rounded-full font-black text-xs">VER MENU</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-brand-surface rounded-[2.5rem] border border-brand-border overflow-hidden">
                  <div className="p-6 space-y-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <img src={item.image} className="w-16 h-16 rounded-2xl object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                          <p className="text-brand-darkGreen font-black text-xs">R$ {item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center bg-brand-bg rounded-full p-1 border border-brand-border">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center"><Minus size={14} /></button>
                          <span className="w-8 text-center font-black text-xs">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center"><Plus size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-brand-border/30 p-8 flex justify-between items-center">
                    <span className="font-black text-gray-400 uppercase text-xs">Total</span>
                    <span className="text-2xl font-black text-brand-darkGreen">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={() => setView('checkout')} className="w-full bg-white text-black py-6 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-3">
                  CHECKOUT <ArrowRight size={20} />
                </button>
              </div>
            )}
          </section>
        )}

        {view === 'checkout' && (
          <section className="max-w-xl mx-auto animate-in fade-in">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setView('cart')} className="p-2 bg-brand-surface rounded-full text-white"><ChevronLeft size={24} /></button>
              <h2 className="text-2xl font-black text-white uppercase">Entrega</h2>
            </div>
            <div className="bg-brand-surface rounded-[2.5rem] p-8 border border-brand-border space-y-6 text-left">
              <div className="space-y-4">
                <input 
                  type="text" placeholder="Seu Nome" 
                  className="w-full bg-brand-bg border border-brand-border rounded-xl py-4 px-6 focus:border-brand-darkGreen outline-none font-bold text-white"
                  value={customer.customerName}
                  onChange={(e) => setCustomer({...customer, customerName: e.target.value})}
                />
                <div className="flex gap-4">
                  <input 
                    type="text" placeholder="Rua" 
                    className="flex-1 bg-brand-bg border border-brand-border rounded-xl py-4 px-6 focus:border-brand-darkGreen outline-none font-bold text-white"
                    value={customer.street}
                    onChange={(e) => setCustomer({...customer, street: e.target.value})}
                  />
                  <input 
                    type="text" placeholder="Nº" 
                    className="w-24 bg-brand-bg border border-brand-border rounded-xl py-4 px-6 focus:border-brand-darkGreen outline-none font-bold text-white text-center"
                    value={customer.number}
                    onChange={(e) => setCustomer({...customer, number: e.target.value})}
                  />
                </div>
                <input 
                  type="text" placeholder="Ponto de Referência" 
                  className="w-full bg-brand-bg border border-brand-border rounded-xl py-4 px-6 focus:border-brand-darkGreen outline-none font-bold text-white"
                  value={customer.referencePoint}
                  onChange={(e) => setCustomer({...customer, referencePoint: e.target.value})}
                />
              </div>
              <button 
                onClick={async () => {
                  if(!customer.customerName || !customer.street) return alert('Preencha os dados.');
                  const order: Order = {
                    id: Math.random().toString(36).substr(2, 6).toUpperCase(),
                    customer, items: cart, total: cartTotal, date: new Date().toLocaleTimeString(), status: 'Pendente'
                  };
                  await dbService.addOrder(order);
                  setView('success');
                  setCart([]);
                }}
                className="w-full bg-brand-orange text-white py-6 rounded-2xl font-black uppercase shadow-lg shadow-brand-orange/20"
              >
                CONFIRMAR PEDIDO
              </button>
            </div>
          </section>
        )}

        {view === 'admin' && (
          <section className="animate-in fade-in">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-white uppercase">Painel Gestão</h2>
              <div className="flex bg-brand-surface p-1 rounded-xl">
                <button onClick={() => setAdminTab('pedidos')} className={`px-4 py-2 rounded-lg text-[10px] font-black ${adminTab === 'pedidos' ? 'bg-brand-darkGreen text-white' : 'text-gray-400'}`}>PEDIDOS</button>
                <button onClick={() => setAdminTab('produtos')} className={`px-4 py-2 rounded-lg text-[10px] font-black ${adminTab === 'produtos' ? 'bg-brand-darkGreen text-white' : 'text-gray-400'}`}>PRODUTOS</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adminTab === 'pedidos' && orders.map(order => (
                <div key={order.id} className="bg-brand-surface p-6 rounded-[2rem] border border-brand-border text-left">
                  <div className="flex justify-between mb-4">
                    <span className="font-black text-brand-darkGreen">#{order.id}</span>
                    <span className="text-[10px] font-bold text-gray-500">{order.date}</span>
                  </div>
                  <h4 className="font-bold text-white mb-2">{order.customer.customerName}</h4>
                  <div className="text-[10px] text-gray-400 mb-6 space-y-1">
                    {order.items.map((it, i) => <div key={i}>{it.quantity}x {it.name}</div>)}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleCompleteOrder(order.id)} className="flex-1 bg-brand-darkGreen text-white py-3 rounded-xl font-black text-[10px] uppercase">ENTREGUE</button>
                    <button onClick={() => window.open(generateWhatsAppMessage(order))} className="flex-1 bg-brand-border text-white py-3 rounded-xl font-black text-[10px] uppercase">WHATSAPP</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'success' && (
          <section className="text-center py-20 animate-in zoom-in-95">
            <div className="bg-brand-darkGreen/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-brand-darkGreen">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 uppercase">Sucesso!</h2>
            <p className="text-gray-400 mb-10">Seu pedido já está em nossa cozinha.</p>
            <button onClick={() => setView('menu')} className="bg-white text-black px-12 py-4 rounded-full font-black uppercase text-xs">VOLTAR AO MENU</button>
          </section>
        )}
      </main>

      {/* AI Recommendation Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-brand-surface w-full max-w-lg rounded-[2.5rem] p-8 border border-brand-border relative">
            <button onClick={() => setShowAiModal(false)} className="absolute top-6 right-6 text-gray-500"><X size={24} /></button>
            <div className="text-center mb-8">
              <div className="bg-brand-darkGreen/20 p-4 rounded-full inline-block mb-4"><Wand2 className="text-brand-darkGreen" size={32} /></div>
              <h3 className="text-2xl font-black text-white uppercase">IA MAIS LEVE</h3>
              <p className="text-gray-500 text-sm">O que você deseja sentir hoje?</p>
            </div>
            {!aiResult ? (
              <div className="space-y-6">
                <textarea 
                  className="w-full bg-brand-bg border border-brand-border rounded-2xl py-4 px-5 focus:border-brand-darkGreen outline-none font-bold text-white h-32 resize-none"
                  placeholder="Ex: Algo leve para o jantar com peixe..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                />
                <button 
                  onClick={handleAiRecommendation}
                  disabled={aiLoading}
                  className="w-full py-5 bg-brand-darkGreen text-white rounded-2xl font-black uppercase flex items-center justify-center gap-3"
                >
                  {aiLoading ? <Loader2 className="animate-spin" /> : 'RECOMENDAR'}
                </button>
              </div>
            ) : (
              <div className="text-left">
                <div className="bg-brand-bg p-6 rounded-3xl border border-brand-border mb-6">
                  <h4 className="font-black text-brand-darkGreen mb-2">ESCOLHA IDEAL:</h4>
                  <p className="text-white text-sm italic">"{aiResult.justification}"</p>
                </div>
                <button 
                  onClick={() => {
                    const s = sandwiches.find(x => x.id === aiResult.sandwichId);
                    if(s) addToCart(s);
                    setShowAiModal(false);
                  }}
                  className="w-full py-5 bg-brand-orange text-white rounded-2xl font-black uppercase"
                >
                  ADICIONAR À CESTA
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

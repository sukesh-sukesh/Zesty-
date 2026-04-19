import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { placeOrder } from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, Minus, Plus, ShoppingBag, ArrowLeft } from 'lucide-react';

const RestaurantMenu = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem('user'));
    const restaurant = state?.restaurant;

    const [cart, setCart] = useState({});
    const [ordering, setOrdering] = useState(false);

    if (!restaurant) {
        return <div className="p-10 text-center"><p className="text-slate-500 mb-4">No restaurant data found.</p><button onClick={() => navigate('/user/home')} className="bg-primary px-4 py-2 rounded text-white font-bold">Go Back</button></div>;
    }

    const { menu } = restaurant;

    const addToCart = (item) => {
        setCart(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    };

    const removeFromCart = (item) => {
        setCart(prev => {
            const newCount = (prev[item.id] || 0) - 1;
            if (newCount <= 0) {
                const newCart = { ...prev };
                delete newCart[item.id];
                return newCart;
            }
            return { ...prev, [item.id]: newCount };
        });
    };

    const cartItems = Object.keys(cart).map(itemId => {
        const item = menu.find(m => m.id === parseInt(itemId));
        return { ...item, quantity: cart[itemId] };
    });

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = totalAmount * 0.05;
    const deliveryFee = 40;
    const finalAmount = totalAmount + tax + deliveryFee;

    const handleCheckout = async () => {
        if (!user || cartItems.length === 0) return;
        setOrdering(true);
        const itemsStr = cartItems.map(i => `${i.name} (x${i.quantity})`).join(', ');

        const res = await placeOrder({
            user_id: user.id,
            restaurant_name: restaurant.name,
            items: itemsStr,
            total_amount: Math.round(finalAmount)
        });

        if (res.error) {
            alert(res.error);
            setOrdering(false);
        } else {
            navigate('/user/orders');
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start relative pb-20 lg:pb-0">
            {/* Menu List */}
            <div className="flex-1 w-full">
                <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-base-secondaryText font-bold hover:text-base-text transition-colors">
                    <ArrowLeft size={16} /> Back to Catalog
                </button>

                <div className="bg-base-card rounded-[2rem] p-6 lg:p-10 shadow-sm border border-base-border mb-8 border-t-[8px] border-t-primary relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[50px] pointer-events-none" />
                    <div className="flex justify-between items-start mb-6 border-b border-base-border pb-6 relative z-10">
                        <div>
                            <h1 className="text-3xl font-black text-base-text tracking-tight leading-none mb-2">{restaurant.name}</h1>
                            <p className="text-base-secondaryText text-sm font-medium">{restaurant.tags?.join(', ')} • {restaurant.zone}</p>
                        </div>
                        <div className="flex flex-col items-center bg-base-bg border border-base-border rounded-2xl p-3 shadow-inner">
                            <div className="flex items-center gap-1 font-black text-lg text-accent mb-1">
                                <Star className="fill-accent" size={16} /> {restaurant.rating}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest border-t border-base-border pt-1">Delivery</span>
                            <span className="text-xs font-bold text-base-text">{restaurant.delivery_time}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 max-w-3xl">
                    <h3 className="font-black text-base-text text-xl tracking-tight mb-4 border-l-4 border-primary pl-3 bg-base-bg py-1">Recommended</h3>
                    {menu.map(item => (
                        <div key={item.id} className="bg-base-card border border-base-border p-6 rounded-3xl flex items-center justify-between group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            <div className="flex-1 pr-6">
                                <div className="w-4 h-4 rounded-sm border-2 border-accent flex items-center justify-center mb-2">
                                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                                </div>
                                <h4 className="font-bold text-base-text text-lg">{item.name}</h4>
                                <p className="font-bold text-base-secondaryText mb-2">&#x20b9;{item.price}</p>
                                <p className="text-sm font-medium text-slate-500 leading-snug">{item.description}</p>
                            </div>
                            <div className="relative">
                                {/* Use unsplash keyword search directly in URL for food */}
                                <div
                                    className="w-32 h-32 rounded-2xl bg-base-bg border border-base-border shadow-inner -z-10 bg-cover bg-center"
                                    style={{ backgroundImage: `url('https://source.unsplash.com/400x400/?${encodeURIComponent(item.name.split(' ')[0] + ' food')}')` }}
                                ></div>
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10">
                                    {!cart[item.id] ? (
                                        <button onClick={() => addToCart(item)} className="bg-base-card text-accent font-black border border-accent/30 uppercase text-sm tracking-wide px-8 py-2.5 rounded-xl shadow-lg hover:bg-accent/5 transition-all hover:-translate-y-0.5 whitespace-nowrap">
                                            Add
                                        </button>
                                    ) : (
                                        <div className="bg-base-card border border-accent/30 rounded-xl flex items-center justify-center shadow-lg overflow-hidden w-24">
                                            <button onClick={() => removeFromCart(item)} className="p-2 text-base-secondaryText hover:text-red-500 hover:bg-base-bg transition-colors w-1/3 flex justify-center"><Minus size={16} /></button>
                                            <span className="font-black text-base-text text-sm w-1/3 text-center">{cart[item.id]}</span>
                                            <button onClick={() => addToCart(item)} className="p-2 text-accent hover:bg-accent/5 transition-colors w-1/3 flex justify-center"><Plus size={16} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sidebar Cart */}
            <AnimatePresence>
                {cartItems.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="w-full lg:w-[400px] sticky top-28 bg-base-card border border-base-border rounded-[2rem] shadow-xl p-6 lg:p-8 flex flex-col z-40 fixed lg:relative bottom-0 inset-x-0 lg:bottom-auto rounded-b-none lg:rounded-[2rem] max-h-[85vh]"
                    >
                        <h2 className="text-2xl font-black text-base-text mb-6 flex items-center gap-3 tracking-tight">
                            <ShoppingBag className="text-primary" /> Cart
                        </h2>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6">
                            {cartItems.map(item => (
                                <div key={item.id} className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <div className="w-2.5 h-2.5 rounded-sm border border-accent flex items-center justify-center shrink-0"><div className="w-1 h-1 bg-accent rounded-full"></div></div>
                                            <h4 className="font-bold text-base-text text-sm leading-tight">{item.name}</h4>
                                        </div>
                                        <div className="text-xs font-bold text-base-secondaryText pl-4">&#x20b9;{item.price}</div>
                                    </div>

                                    <div className="bg-base-card border border-base-border rounded-lg flex items-center justify-between shadow-sm overflow-hidden w-20 shrink-0 h-8">
                                        <button onClick={() => removeFromCart(item)} className="px-2 text-base-secondaryText hover:text-red-500 hover:bg-base-bg transition-colors h-full flex items-center"><Minus size={12} /></button>
                                        <span className="font-black text-base-text text-xs w-full text-center">{item.quantity}</span>
                                        <button onClick={() => addToCart(item)} className="px-2 text-accent hover:bg-accent/5 transition-colors h-full flex items-center"><Plus size={12} /></button>
                                    </div>
                                    <div className="font-black text-base-text w-12 text-right text-sm">
                                        &#x20b9;{item.price * item.quantity}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-base-border pt-6 space-y-3 font-medium text-sm text-base-secondaryText">
                            <div className="flex justify-between"><p>Item Total</p><p>&#x20b9;{totalAmount}</p></div>
                            <div className="flex justify-between"><p>Delivery Fee</p><p>&#x20b9;{deliveryFee}</p></div>
                            <div className="flex justify-between border-b border-base-bg pb-3"><p>Govt Taxes (5%)</p><p>&#x20b9;{tax.toFixed(2)}</p></div>

                            <div className="flex justify-between items-center text-lg font-black text-base-text pt-2">
                                <p>To Pay</p>
                                <p>&#x20b9;{Math.round(finalAmount)}</p>
                            </div>
                        </div>

                        <button
                            disabled={ordering}
                            onClick={handleCheckout}
                            className="mt-6 w-full py-4 bg-primary text-white font-black uppercase tracking-wider rounded-xl shadow-[0_4px_14px_rgba(252,128,25,0.4)] hover:shadow-[0_6px_20px_rgba(252,128,25,0.5)] hover:bg-primary-hover hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                        >
                            {ordering ? 'Placing Order...' : 'Checkout & Proceed'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RestaurantMenu;

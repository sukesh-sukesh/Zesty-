import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { getRestaurants } from '../../api';
import { motion } from 'framer-motion';
import { Star, Clock, Search } from 'lucide-react';

const UserHome = () => {
    const { userLocation } = useOutletContext();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRest = async () => {
            setLoading(true);
            const data = await getRestaurants(userLocation);
            setRestaurants(data);
            setLoading(false);
        };
        fetchRest();
    }, [userLocation]);

    const filteredRestaurants = restaurants.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-12 pb-10">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-secondary to-slate-800 rounded-[2rem] p-8 md:p-14 relative overflow-hidden shadow-xl flex items-center">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative z-10 w-full max-w-2xl">
                    <h1 className="text-4xl md:text-5xl lg:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
                        Discover the best food & drinks in <span className="text-primary">{userLocation}</span>
                    </h1>
                    <p className="text-lg text-slate-300 font-medium mb-8">
                        Get fresh, delicious meals delivered exactly when you want them.
                    </p>

                    <div className="relative w-full max-w-xl">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="text-slate-400" size={20} />
                        </div>
                        <input
                            type="text"
                            className="w-full bg-white text-base-text rounded-xl py-4 pl-12 pr-4 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary font-medium placeholder:text-slate-400"
                            placeholder="Search for restaurant, cuisine or a dish..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-black text-base-text mb-8 tracking-tight">
                    Top Restaurant Chains in {userLocation}
                </h2>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="animate-pulse flex flex-col gap-3">
                                <div className="bg-slate-200 rounded-2xl h-52 w-full"></div>
                                <div className="bg-slate-200 h-5 w-3/4 rounded-md mt-2"></div>
                                <div className="bg-slate-200 h-4 w-1/2 rounded-md"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredRestaurants.map((rest, index) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                key={rest.id}
                                onClick={() => navigate(`/user/restaurant/${rest.id}`, { state: { restaurant: rest } })}
                                className="group cursor-pointer flex flex-col bg-base-card rounded-2xl p-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-base-border"
                            >
                                <div className="relative h-48 w-full rounded-xl overflow-hidden mb-4">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 transition-opacity group-hover:opacity-80"></div>
                                    <img
                                        src={rest.image}
                                        alt={rest.name}
                                        loading="lazy"
                                        onError={(e) => { e.target.src = "/src/assets/images/foods/default_food.jpg"; }}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                    />
                                    <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
                                        <p className="text-white font-black text-sm tracking-wide bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                                            <Clock size={14} /> {rest.delivery_time}
                                        </p>
                                    </div>
                                    <div className="absolute top-3 right-3 z-20 bg-accent text-white px-2 py-1 rounded-md text-xs font-bold shadow-md flex items-center gap-1">
                                        <Star size={12} className="fill-white" />
                                        {rest.rating}
                                    </div>
                                </div>
                                <div className="px-1 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-base-text truncate group-hover:text-primary transition-colors">{rest.name}</h3>
                                    <p className="text-base-secondaryText text-sm font-medium mt-1 truncate">{rest.tags?.join(', ')}</p>
                                    <div className="mt-auto pt-4 flex items-center justify-between">
                                        <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide">
                                            View Menu
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {filteredRestaurants.length === 0 && (
                            <div className="col-span-full py-16 text-center text-base-secondaryText font-medium bg-base-card rounded-2xl shadow-sm border border-base-border flex flex-col items-center">
                                <Search className="text-slate-300 mb-4" size={48} />
                                <p className="text-lg text-base-text font-bold">No restaurants found</p>
                                <p className="text-sm">Try adjusting your search criteria in {userLocation}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserHome;

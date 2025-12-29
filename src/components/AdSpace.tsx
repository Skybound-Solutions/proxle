import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdSpaceProps {
    type?: 'banner' | 'coffee';
    variant?: 'default' | 'header';
}

const AdSpace: React.FC<AdSpaceProps> = ({ type = 'coffee', variant = 'default' }) => {
    const [index, setIndex] = React.useState(0);

    const phrases = [
        "Support",
        "No Ads?",
        "Pay Bills",
        "Server Cost",
        "Fuel Code",
        "Buy Coffee",
        "Help Out",
        "Keep Going",
        "Be a Hero",
        "Dev Fuel",
        "Send Love",
        "Good Karma",
        "Chip In",
        "Power AI"
    ];

    React.useEffect(() => {
        if (variant !== 'header' || type !== 'coffee') return;

        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % phrases.length);
        }, 60000); // Every 60 seconds

        return () => clearInterval(interval);
    }, [variant, type, phrases.length]);

    if (variant === 'header') {
        return (
            <div className="flex-1 flex justify-center px-4">
                {type === 'coffee' ? (
                    <a
                        href="https://ko-fi.com/skyboundmi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all active:scale-95 group overflow-hidden w-[140px] justify-start relative"
                    >
                        <span className="text-lg shrink-0 z-10">☕</span>

                        {/* Fixed height container for text */}
                        <div className="h-[20px] relative flex-1 overflow-hidden flex items-center">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={index}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-[10px] font-bold text-white/70 group-hover:text-white uppercase tracking-wider whitespace-nowrap absolute left-0"
                                >
                                    {phrases[index]}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </a>
                ) : (
                    <div className="h-8 w-24 bg-white/5 rounded flex items-center justify-center border border-white/5">
                        <span className="text-[8px] text-white/20 uppercase tracking-widest">Ad</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full my-4 bg-white/5 border border-white/10 rounded-lg overflow-hidden shrink-0">
            {/* Label */}
            <div className="bg-black/20 px-2 py-1 text-[10px] text-white/30 uppercase tracking-widest flex justify-between items-center">
                <span>{type === 'coffee' ? 'Support' : 'Sponsored'}</span>
                {type === 'coffee' && <span>♥</span>}
            </div>

            {/* Content Area */}
            <div className="p-3 flex items-center justify-center">
                {type === 'coffee' ? (
                    <a
                        href="https://ko-fi.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 group transition-all hover:scale-105"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#FF5E5B] flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                            ☕
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white group-hover:text-[#FF5E5B] transition-colors">Buy me a coffee</span>
                            <span className="text-xs text-white/50">Keep Proxle free!</span>
                        </div>
                    </a>
                ) : (
                    <div className="text-center w-full">
                        <div className="flex justify-center items-center h-[50px] bg-white/5 rounded mx-auto w-full max-w-[300px]">
                            <span className="text-[10px] text-white/20 font-mono">AdSense Unit</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdSpace;

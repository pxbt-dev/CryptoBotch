import React, { useEffect, useState } from 'react';
import { LineChart } from 'lucide-react';

const Indicators = ({ symbol }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let intervalId;
        const fetchIndicators = async () => {
            try {
                const res = await fetch(`/api/market/indicators/${symbol.toUpperCase()}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json.latest);
                }
            } catch (err) {
                console.error("[Indicators] Fetch failed:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchIndicators();
        // Poll every 5 seconds since indicators are calculated from historical klines
        intervalId = setInterval(fetchIndicators, 5000);

        return () => clearInterval(intervalId);
    }, [symbol]);

    if (loading && !data) return <div className="p-4 text-[10px] text-gray-500 animate-pulse">CALCULATING...</div>;
    if (!data) return <div className="p-4 text-[10px] text-red-500">OFFLINE</div>;

    const getRsiColor = (rsi) => {
        if (rsi > 70) return 'text-bear font-bold';
        if (rsi < 30) return 'text-bull font-bold';
        return 'text-white/80';
    };

    return (
        <div className="flex flex-col h-full overflow-hidden border-b border-border-dim bg-white/[0.01]">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Indicators</span>
                <LineChart size={12} className="text-yellow-500" />
            </div>
            <div className="flex-1 p-4 flex items-center justify-center">
                <span className="text-[8px] text-gray-700 uppercase font-bold text-center tracking-widest">Select indicators per chart</span>
            </div>
        </div>
    );
};

export default Indicators;

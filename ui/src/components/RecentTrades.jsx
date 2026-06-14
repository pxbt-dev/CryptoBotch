import React, { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { TrendingUp } from 'lucide-react';

const RecentTrades = ({ symbol }) => {
    const [trades, setTrades] = useState([]);

    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const brokerURL = `${protocol}//${window.location.host}/ws-market`;
        
        console.log(`[RecentTrades] Connecting to ${brokerURL} for ${symbol}`);

        const stompClient = new Client({
            brokerURL,
            onConnect: (frame) => {
                console.log(`[RecentTrades] Connected: ${frame.headers['user-name'] || 'anonymous'}`);
                stompClient.subscribe(`/topic/trades/${symbol.toLowerCase()}`, (message) => {
                    const data = JSON.parse(message.body);
                    setTrades(prev => [data, ...prev].slice(0, 30));
                });
            },
            onStompError: (frame) => {
                console.error('[RecentTrades] Broker reported error: ' + frame.headers['message']);
            },
            onWebSocketClose: () => {
                console.warn('[RecentTrades] WebSocket connection closed');
            }
        });
        stompClient.activate();

        return () => {
            console.log(`[RecentTrades] Deactivating for ${symbol}`);
            stompClient.deactivate();
        };
    }, [symbol]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Recent Trades / {symbol}</span>
                <TrendingUp size={12} className="text-purple-500" />
            </div>
            <div className="flex-1 p-2 font-mono text-[10px] overflow-y-auto custom-scrollbar">
                {trades.map((trade, i) => (
                    <div key={i} className="flex items-center justify-between px-2 py-1 hover:bg-white/2 transition-colors border-b border-border-dim last:border-0 text-[9px]">
                        <span className={!trade.m ? "text-bull font-bold" : "text-bear font-bold"}>
                            {parseFloat(trade.p).toFixed(2)}
                        </span>
                        <span className="text-white/60">{parseFloat(trade.q).toFixed(4)}</span>
                        <span className="text-gray-600">{new Date(trade.T).toLocaleTimeString([], { hour12: false })}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentTrades;

import React, { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Activity } from 'lucide-react';

const OrderBook = ({ symbol }) => {
    const [orders, setOrders] = useState({ bids: [], asks: [] });

    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const brokerURL = `${protocol}//${window.location.host}/ws-market`;
        
        console.log(`[OrderBook] Connecting to ${brokerURL} for ${symbol}`);
        
        const stompClient = new Client({
            brokerURL,
            onConnect: (frame) => {
                console.log(`[OrderBook] Connected: ${frame.headers['user-name'] || 'anonymous'}`);
                stompClient.subscribe(`/topic/orderbook/${symbol.toLowerCase()}`, (message) => {
                    const data = JSON.parse(message.body);
                    if (data && data.bids && data.asks) {
                        setOrders({
                            bids: data.bids.slice(0, 15),
                            asks: data.asks.slice(0, 15)
                        });
                    }
                });
            },
            onStompError: (frame) => {
                console.error('[OrderBook] Broker reported error: ' + frame.headers['message']);
                console.error('[OrderBook] Additional details: ' + frame.body);
            },
            onWebSocketClose: () => {
                console.warn('[OrderBook] WebSocket connection closed');
            }
        });
        stompClient.activate();

        return () => {
            console.log(`[OrderBook] Deactivating for ${symbol}`);
            stompClient.deactivate();
        };
    }, [symbol]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border-dim flex items-center justify-between bg-white/[0.02]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Order Book / {symbol}</span>
                <Activity size={12} className="text-blue-500" />
            </div>
            <div className="flex-1 p-2 font-mono text-[10px] overflow-hidden flex flex-col">
                <div className="grid grid-cols-3 text-gray-600 mb-2 px-2 font-bold uppercase tracking-tighter">
                    <span>Price</span>
                    <span className="text-right">Size</span>
                    <span className="text-right">Sum</span>
                </div>
                {/* Asks */}
                <div className="flex flex-col-reverse">
                    {orders.asks.map((ask, i) => (
                        <div key={`ask-${i}`} className="grid grid-cols-3 px-2 py-0.5 relative group hover:bg-bear/5 transition-colors cursor-pointer text-[9px]">
                            <div className="absolute inset-y-0 right-0 bg-bear/10" style={{ width: `${Math.random() * 80}%` }}></div>
                            <span className="text-bear z-10 font-bold">{parseFloat(ask[0]).toFixed(2)}</span>
                            <span className="text-right z-10 text-white/80">{parseFloat(ask[1]).toFixed(4)}</span>
                            <span className="text-right text-gray-500 z-10">{(parseFloat(ask[0]) * parseFloat(ask[1])).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                {orders.bids.length > 0 && (
                    <div className="my-1 py-1 border-y border-white/5 text-center text-lg font-bold text-white bg-white/5">
                        {parseFloat(orders.bids[0][0]).toFixed(2)}
                    </div>
                )}
                {/* Bids */}
                <div className="flex flex-col">
                    {orders.bids.map((bid, i) => (
                        <div key={`bid-${i}`} className="grid grid-cols-3 px-2 py-0.5 relative group hover:bg-bull/5 transition-colors cursor-pointer text-[9px]">
                            <div className="absolute inset-y-0 right-0 bg-bull/10" style={{ width: `${Math.random() * 80}%` }}></div>
                            <span className="text-bull z-10 font-bold">{parseFloat(bid[0]).toFixed(2)}</span>
                            <span className="text-right z-10 text-white/80">{parseFloat(bid[1]).toFixed(4)}</span>
                            <span className="text-right text-gray-500 z-10">{(parseFloat(bid[0]) * parseFloat(bid[1])).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OrderBook;

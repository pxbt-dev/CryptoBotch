import React, { useEffect, useState, useRef } from 'react';

const Sparkline = ({ symbol, color }) => {
    const canvasRef = useRef(null);
    const [data, setData] = useState([]);

    useEffect(() => {
        // Fetch last 20 1m candles for sparkline
        fetch(`/api/market/history/${symbol.toUpperCase()}`)
            .then(res => res.json())
            .then(history => {
                setData(history.slice(-30).map(d => d.price));
            })
            .catch(() => {});
    }, [symbol]);

    useEffect(() => {
        if (data.length < 2) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.strokeStyle = color === 'bull' ? '#00ff00' : '#ff0000';
        ctx.lineWidth = 1.2;

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        data.forEach((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }, [data, color]);

    return <canvas ref={canvasRef} width={60} height={20} className="ml-auto" />;
};

export default Sparkline;

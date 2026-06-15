import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, LineStyle, CandlestickSeries, LineSeries, BarSeries, HistogramSeries } from 'lightweight-charts';
import { Activity, Search, X, ChevronDown } from 'lucide-react';
import { useStomp } from '../StompContext.jsx';

const CHART_TYPES = [
    { id: 'candlestick', label: 'C', title: 'Candles' },
    { id: 'heikinashi', label: 'HA', title: 'Heikin Ashi' },
    { id: 'line',        label: 'L', title: 'Line' },
    { id: 'bar',         label: 'B', title: 'Bars' },
]

const TIMEFRAMES = [
    { id: '1m', label: '1m' }, { id: '3m', label: '3m' }, { id: '5m', label: '5m' },
    { id: '15m', label: '15m' }, { id: '30m', label: '30m' }, { id: '1h', label: '1H' },
    { id: '2h', label: '2H' }, { id: '4h', label: '4H' }, { id: '6h', label: '6H' },
    { id: '12h', label: '12H' }, { id: '1d', label: '1D' }, { id: '3d', label: '3D' },
    { id: '1w', label: '1W' },
]

const INDICATORS = [
    { id: 'ACCD', label: 'ACCD', category: 'Overlay' },
    { id: 'ADR', label: 'ADR', category: 'Overlay' },
    { id: 'AROON', label: 'AROON', category: 'Oscillator' },
    { id: 'ATR', label: 'ATR', category: 'Volatility' },
    { id: 'AO', label: 'Awesome Oscillator', category: 'Oscillator' },
    { id: 'BB', label: 'Bollinger Bands', category: 'Overlay', color: '#aaaaaa', supported: true },
    { id: 'BBR', label: 'Bollinger Bands %R', category: 'Overlay' },
    { id: 'BBW', label: 'Bollinger Bands Width', category: 'Overlay' },
    { id: 'CMF', label: 'CMF', category: 'Volume' },
    { id: 'CHAIKIN', label: 'Chaikin Oscillator', category: 'Oscillator' },
    { id: 'CHANDE', label: 'Chande MO', category: 'Oscillator' },
    { id: 'CHOP', label: 'Choppiness Index', category: 'Volatility' },
    { id: 'CCI', label: 'CCI', category: 'Oscillator' },
    { id: 'CRSI', label: 'CRSI', category: 'Oscillator' },
    { id: 'CORR', label: 'Correlation Coefficient', category: 'Misc' },
    { id: 'DPO', label: 'Detrended Price Oscillator', category: 'Oscillator' },
    { id: 'DM', label: 'DM', category: 'Trend' },
    { id: 'DONCH', label: 'DONCH', category: 'Overlay' },
    { id: 'DEMA', label: 'Double EMA', category: 'Overlay' },
    { id: 'EOM', label: 'Ease Of Movement', category: 'Volume' },
    { id: 'EFI', label: 'EFI', category: 'Volume' },
    { id: 'ENV', label: 'ENV', category: 'Overlay' },
    { id: 'FISHER', label: 'Fisher Transform', category: 'Oscillator' },
    { id: 'HV', label: 'HV', category: 'Volatility' },
    { id: 'HMA', label: 'Hull MA', category: 'Overlay' },
    { id: 'ICHIMOKU', label: 'Ichimoku Cloud', category: 'Overlay' },
    { id: 'KLTNR', label: 'KLTNR', category: 'Overlay' },
    { id: 'KST', label: 'KST', category: 'Oscillator' },
    { id: 'LINREG', label: 'Linear Regression', category: 'Trend' },
    { id: 'MACD', label: 'MACD', category: 'Oscillator', color: '#2196f3', supported: true },
    { id: 'MOM', label: 'MOM', category: 'Oscillator' },
    { id: 'MF', label: 'MF', category: 'Volume' },
    { id: 'MOON', label: 'Moon Phases', category: 'Misc' },
    { id: 'SMA', label: 'MA Simple (20)', category: 'Overlay', color: '#0088ff', supported: true },
    { id: 'SMA50', label: 'SMA 50', category: 'Overlay', color: '#ffcc00', supported: true },
    { id: 'SMA200', label: 'SMA 200', category: 'Overlay', color: '#ff4400', supported: true },
    { id: 'EMA', label: 'MA Exp (20)', category: 'Overlay', color: '#ffffff', supported: true },
    { id: 'WMA', label: 'MA Weighted', category: 'Overlay' },
    { id: 'OBV', label: 'OBV', category: 'Volume' },
    { id: 'PSAR', label: 'PSAR', category: 'Overlay' },
    { id: 'PPHL', label: 'Pivot Points High Low', category: 'Overlay' },
    { id: 'PPS', label: 'Pivot Points Standard', category: 'Overlay' },
    { id: 'PRICE_OSC', label: 'Price Osc', category: 'Oscillator' },
    { id: 'PVT', label: 'Price Volume Trend', category: 'Volume' },
    { id: 'ROC', label: 'ROC', category: 'Oscillator' },
    { id: 'RSI', label: 'RSI (14)', category: 'Oscillator', color: '#7e57c2', supported: true },
    { id: 'VIGOR', label: 'Vigor Index', category: 'Oscillator' },
    { id: 'VOLATILITY', label: 'Volatility Index', category: 'Volatility' },
    { id: 'SMI_IND', label: 'SMI Ergodic Indicator', category: 'Oscillator' },
    { id: 'SMI_OSC', label: 'SMI Ergodic Oscillator', category: 'Oscillator' },
    { id: 'STOCH', label: 'Stochastic', category: 'Oscillator' },
    { id: 'STOCH_RSI', label: 'Stochastic RSI', category: 'Oscillator' },
    { id: 'TEMA', label: 'Triple EMA', category: 'Overlay' },
    { id: 'TRIX', label: 'Trix', category: 'Oscillator' },
    { id: 'ULTIMATE', label: 'Ultimate Osc', category: 'Oscillator' },
    { id: 'VSTOP', label: 'VSTOP', category: 'Overlay' },
    { id: 'VOLUME', label: 'Volume', category: 'Volume', color: 'rgba(120,180,255,0.6)', supported: true },
    { id: 'VWAP', label: 'VWAP', category: 'Overlay', color: '#9c27b0', supported: true },
    { id: 'VWMA', label: 'MA Volume Weighted', category: 'Overlay' },
    { id: 'WILLIAM_R', label: 'William R', category: 'Oscillator' },
    { id: 'ALLIGATOR', label: 'Williams Alligator', category: 'Overlay' },
    { id: 'FRACTAL', label: 'Williams Fractal', category: 'Overlay' },
    { id: 'ZIGZAG', label: 'ZigZag', category: 'Overlay' },
    { id: 'FIB_LEVELS', label: 'Fibonacci Levels', category: 'Overlay', color: '#f59e0b', supported: true },
    { id: 'FIB_TIME', label: 'Fibonacci Time Series', category: 'Overlay', color: '#f59e0b', supported: true },
]

const toHeikinAshi = (candles) =>
    candles.reduce((acc, curr, i) => {
        const prev = acc[i - 1]
        const haClose = (curr.open + curr.high + curr.low + curr.close) / 4
        const haOpen = prev ? (prev.open + prev.close) / 2 : (curr.open + curr.close) / 2
        acc.push({
            time: curr.time,
            open: haOpen,
            high: Math.max(curr.high, haOpen, haClose),
            low: Math.min(curr.low, haOpen, haClose),
            close: haClose,
        })
        return acc
    }, [])

const TradingChart = ({ symbol, theme = 'default' }) => {
    const chartContainerRef = useRef()
    const chartRef = useRef()
    const seriesRef = useRef()
    const emaRef = useRef()
    const smaRef = useRef()
    const sma50Ref = useRef()
    const sma200Ref = useRef()
    const bbUpperRef = useRef()
    const bbLowerRef = useRef()
    const vwapRef = useRef()
    const rsiRef = useRef()
    const macdRef = useRef()
    const macdSignalRef = useRef()
    const macdHistRef = useRef()
    const volumeRef = useRef()
    const haStateRef = useRef({ open: 0, close: 0 })
    const chartTypeRef = useRef('candlestick')
    const rafIdRef = useRef(null)

    const [searchTerm, setSearchTerm] = useState('')
    const [timeframe, setTimeframe] = useState('1m')
    const [showTfMenu, setShowTfMenu] = useState(false)
    const [visibleIndicators, setVisibleIndicators] = useState(['EMA', 'BB'])
    const [latestValues, setLatestValues] = useState({})
    const [showMenu, setShowMenu] = useState(false)
    const [error, setError] = useState(null)
    const [status, setStatus] = useState('CONNECTING...')
    const [chartType, setChartType] = useState('candlestick')
    const [upColor, setUpColor] = useState('#00ff00')
    const [downColor, setDownColor] = useState('#ff0000')

    const { subscribe, unsubscribe } = useStomp()
    const isLegacy = theme === 'legacy'

    // Keep refs in sync so STOMP callback always reads current values
    chartTypeRef.current = chartType

    const filteredIndicators = INDICATORS.filter(ind =>
        ind.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ind.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const toggleIndicator = (id) => {
        setVisibleIndicators(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    // Chart creation + historical data
    useEffect(() => {
        if (!chartContainerRef.current) return

        let chartInstance
        try {
            chartInstance = createChart(chartContainerRef.current, {
                layout: {
                    background: { type: ColorType.Solid, color: isLegacy ? '#000000' : '#05070a' },
                    textColor: isLegacy ? '#555555' : '#d1d4dc',
                    fontSize: 10,
                    fontFamily: 'monospace',
                },
                grid: {
                    vertLines: { color: 'rgba(255,255,255,0.02)' },
                    horzLines: { color: 'rgba(255,255,255,0.02)' },
                },
                rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
                timeScale: { borderColor: 'rgba(255,255,255,0.1)', timeVisible: true },
            })
            chartRef.current = chartInstance

            if (chartType === 'line') {
                seriesRef.current = chartInstance.addSeries(LineSeries, {
                    color: upColor, lineWidth: 2, priceLineVisible: false,
                })
            } else if (chartType === 'bar') {
                seriesRef.current = chartInstance.addSeries(BarSeries, {
                    upColor, downColor,
                })
            } else {
                seriesRef.current = chartInstance.addSeries(CandlestickSeries, {
                    upColor, downColor, borderVisible: false,
                    wickUpColor: upColor, wickDownColor: downColor,
                })
            }

            if (visibleIndicators.includes('EMA'))
                emaRef.current = chartInstance.addSeries(LineSeries, { color: '#ffffff', lineWidth: 1, title: 'EMA', priceLineVisible: false })
            if (visibleIndicators.includes('SMA'))
                smaRef.current = chartInstance.addSeries(LineSeries, { color: '#0088ff', lineWidth: 1, title: 'SMA', priceLineVisible: false })
            if (visibleIndicators.includes('SMA50'))
                sma50Ref.current = chartInstance.addSeries(LineSeries, { color: '#ffcc00', lineWidth: 1, title: 'SMA 50', priceLineVisible: false })
            if (visibleIndicators.includes('SMA200'))
                sma200Ref.current = chartInstance.addSeries(LineSeries, { color: '#ff4400', lineWidth: 1, title: 'SMA 200', priceLineVisible: false })
            if (visibleIndicators.includes('BB')) {
                bbUpperRef.current = chartInstance.addSeries(LineSeries, { color: '#444', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false })
                bbLowerRef.current = chartInstance.addSeries(LineSeries, { color: '#444', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false })
            }

            // VWAP overlay on main chart
            if (visibleIndicators.includes('VWAP')) {
                vwapRef.current = chartInstance.addSeries(LineSeries, {
                    color: '#9c27b0', lineWidth: 1, lineStyle: LineStyle.Dashed,
                    title: 'VWAP', priceLineVisible: false,
                })
            }

            // Volume in main pane, pinned to bottom 20%
            if (visibleIndicators.includes('VOLUME')) {
                volumeRef.current = chartInstance.addSeries(HistogramSeries, {
                    priceFormat: { type: 'volume' },
                    priceScaleId: 'volume',
                    priceLineVisible: false,
                })
                chartInstance.priceScale('volume').applyOptions({
                    scaleMargins: { top: 0.8, bottom: 0 },
                })
            }

            // RSI and MACD in sequential sub-panes
            let nextPane = 1
            if (visibleIndicators.includes('RSI')) {
                const p = nextPane++
                rsiRef.current = chartInstance.addSeries(LineSeries, {
                    color: '#7e57c2', lineWidth: 1, title: 'RSI', priceLineVisible: false,
                }, p)
                rsiRef.current.createPriceLine({ price: 70, color: 'rgba(255,80,80,0.5)', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false })
                rsiRef.current.createPriceLine({ price: 50, color: 'rgba(255,255,255,0.1)', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false })
                rsiRef.current.createPriceLine({ price: 30, color: 'rgba(80,200,120,0.5)', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false })
            }
            if (visibleIndicators.includes('MACD')) {
                const p = nextPane++
                macdRef.current = chartInstance.addSeries(LineSeries, { color: '#2196f3', lineWidth: 1, title: 'MACD', priceLineVisible: false }, p)
                macdSignalRef.current = chartInstance.addSeries(LineSeries, { color: '#ff9800', lineWidth: 1, title: 'Signal', priceLineVisible: false }, p)
                macdHistRef.current = chartInstance.addSeries(HistogramSeries, { priceLineVisible: false }, p)
                macdHistRef.current.createPriceLine({ price: 0, color: 'rgba(255,255,255,0.15)', lineWidth: 1, lineStyle: LineStyle.Solid, axisLabelVisible: false })
            }

            // Size sub-panes after a frame so they exist in the DOM
            if (nextPane > 1) {
                rafIdRef.current = requestAnimationFrame(() => {
                    try {
                        chartInstance.panes().slice(1).forEach(pane => pane.setHeight(80))
                    } catch (_) {}
                })
            }
        } catch (e) {
            setError('CHART ENGINE ERROR')
            return
        }

        const loadData = async () => {
            try {
                const [historyRes, indicatorsRes] = await Promise.all([
                    fetch(`/api/market/history/${symbol.toUpperCase()}?interval=${timeframe}`),
                    fetch(`/api/market/indicators/${symbol.toUpperCase()}?interval=${timeframe}`),
                ])
                if (!historyRes.ok || !indicatorsRes.ok) throw new Error('API Offline')

                const history = await historyRes.json()
                const indicators = await indicatorsRes.json()

                if (Array.isArray(history)) {
                    const candles = history.map(d => ({
                        time: d.timestamp / 1000,
                        open: Number(d.open), high: Number(d.high),
                        low: Number(d.low), close: Number(d.price),
                        volume: Number(d.volume),
                    })).sort((a, b) => a.time - b.time)

                    if (seriesRef.current) {
                        if (chartType === 'heikinashi') {
                            const ha = toHeikinAshi(candles)
                            seriesRef.current.setData(ha)
                            if (ha.length > 0) {
                                const last = ha[ha.length - 1]
                                haStateRef.current = { open: last.open, close: last.close }
                            }
                        } else if (chartType === 'line') {
                            seriesRef.current.setData(candles.map(c => ({ time: c.time, value: c.close })))
                        } else {
                            seriesRef.current.setData(candles)
                        }
                        setLatestValues(prev => ({ ...prev, price: candles[candles.length - 1]?.close }))
                        // Fibonacci Levels — horizontal price lines between period high/low
                        if (visibleIndicators.includes('FIB_LEVELS') && seriesRef.current) {
                            const high = candles.reduce((m, c) => Math.max(m, c.high), -Infinity)
                            const low  = candles.reduce((m, c) => Math.min(m, c.low),   Infinity)
                            const range = high - low
                            ;[
                                { ratio: 0,     color: 'rgba(255,255,255,0.5)', label: '0%'    },
                                { ratio: 0.236, color: 'rgba(100,210,255,0.8)', label: '23.6%' },
                                { ratio: 0.382, color: 'rgba(80,255,160,0.8)',  label: '38.2%' },
                                { ratio: 0.5,   color: 'rgba(255,220,80,0.8)',  label: '50%'   },
                                { ratio: 0.618, color: 'rgba(255,140,80,0.8)',  label: '61.8%' },
                                { ratio: 0.786, color: 'rgba(220,80,255,0.8)',  label: '78.6%' },
                                { ratio: 1,     color: 'rgba(255,255,255,0.5)', label: '100%'  },
                            ].forEach(({ ratio, color, label }) => {
                                seriesRef.current.createPriceLine({
                                    price: low + range * ratio,
                                    color,
                                    lineWidth: 1,
                                    lineStyle: LineStyle.Dashed,
                                    axisLabelVisible: true,
                                    title: label,
                                })
                            })
                        }

                        // Fibonacci Time Series — markers at Fibonacci bar intervals
                        if (visibleIndicators.includes('FIB_TIME') && seriesRef.current) {
                            const FIB = [1,2,3,5,8,13,21,34,55,89,144,233]
                            const markers = FIB
                                .filter(n => n < candles.length)
                                .map(n => ({
                                    time: candles[n].time,
                                    position: 'belowBar',
                                    color: '#f59e0b',
                                    shape: 'arrowUp',
                                    text: String(n),
                                }))
                            seriesRef.current.setMarkers(markers)
                        }

                        if (volumeRef.current) {
                            volumeRef.current.setData(candles.map(c => ({
                                time: c.time,
                                value: c.volume,
                                color: c.close >= c.open ? 'rgba(0,200,100,0.3)' : 'rgba(255,60,60,0.3)',
                            })))
                            setLatestValues(prev => ({ ...prev, volume: candles[candles.length - 1]?.volume }))
                        }
                    }
                }

                if (indicators?.history && Array.isArray(indicators.history)) {
                    const h = indicators.history
                    setLatestValues(prev => ({ ...prev, ...indicators.latest }))
                    if (emaRef.current) emaRef.current.setData(h.map(d => ({ time: d.timestamp / 1000, value: Number(d.ema) })))
                    if (smaRef.current) smaRef.current.setData(h.map(d => ({ time: d.timestamp / 1000, value: Number(d.sma) })))
                    if (sma50Ref.current) sma50Ref.current.setData(h.map(d => ({ time: d.timestamp / 1000, value: Number(d.sma50) })))
                    if (sma200Ref.current) sma200Ref.current.setData(h.map(d => ({ time: d.timestamp / 1000, value: Number(d.sma200) })))
                    if (bbUpperRef.current) bbUpperRef.current.setData(h.map(d => ({ time: d.timestamp / 1000, value: Number(d.bbUpper) })))
                    if (bbLowerRef.current) bbLowerRef.current.setData(h.map(d => ({ time: d.timestamp / 1000, value: Number(d.bbLower) })))
                    if (vwapRef.current) vwapRef.current.setData(h.map(d => ({ time: d.timestamp / 1000, value: Number(d.vwap) })))
                    if (rsiRef.current) rsiRef.current.setData(h.map(d => ({ time: d.timestamp / 1000, value: Number(d.rsi) })))
                    if (macdRef.current) macdRef.current.setData(h.map(d => ({ time: d.timestamp / 1000, value: Number(d.macd) })))
                    if (macdSignalRef.current) macdSignalRef.current.setData(h.map(d => ({ time: d.timestamp / 1000, value: Number(d.macdSignal) })))
                    if (macdHistRef.current) macdHistRef.current.setData(h.map(d => ({
                        time: d.timestamp / 1000,
                        value: Number(d.macdHist),
                        color: Number(d.macdHist) >= 0 ? 'rgba(0,200,100,0.7)' : 'rgba(255,60,60,0.7)',
                    })))
                }

                setStatus('LIVE')
            } catch (err) {
                setError('DATA LOAD ERROR')
            }
        }

        loadData()

        const resizeObserver = new ResizeObserver(() => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight,
                })
            }
        })
        resizeObserver.observe(chartContainerRef.current)

        return () => {
            cancelAnimationFrame(rafIdRef.current)
            resizeObserver.disconnect()
            chartInstance?.remove()
        }
    }, [symbol, isLegacy, chartType, visibleIndicators, timeframe])

    // Apply colour changes without recreating the chart
    useEffect(() => {
        if (!seriesRef.current) return
        if (chartType === 'line') {
            seriesRef.current.applyOptions({ color: upColor })
        } else {
            seriesRef.current.applyOptions({
                upColor, downColor,
                wickUpColor: upColor, wickDownColor: downColor,
            })
        }
    }, [upColor, downColor, chartType])

    // Live updates via shared STOMP connection
    useEffect(() => {
        const topic = `/topic/market/${symbol.toLowerCase()}`
        subscribe(topic, (message) => {
            const data = JSON.parse(message.body)
            if (!seriesRef.current) return

            const tfMs = timeframe.endsWith('m') ? parseInt(timeframe) * 60000
                       : timeframe.endsWith('h') ? parseInt(timeframe) * 3600000
                       : timeframe.endsWith('d') ? parseInt(timeframe) * 86400000
                       : timeframe.endsWith('w') ? parseInt(timeframe) * 604800000
                       : 60000
            const alignedTime = Math.floor(data.timestamp / tfMs) * tfMs / 1000
            const type = chartTypeRef.current

            if (type === 'line') {
                seriesRef.current.update({ time: alignedTime, value: Number(data.price) })
            } else if (type === 'heikinashi') {
                const haClose = (Number(data.open) + Number(data.high) + Number(data.low) + Number(data.price)) / 4
                const haOpen = (haStateRef.current.open + haStateRef.current.close) / 2 || (Number(data.open) + Number(data.price)) / 2
                const haHigh = Math.max(Number(data.high), haOpen, haClose)
                const haLow = Math.min(Number(data.low), haOpen, haClose)
                haStateRef.current = { open: haOpen, close: haClose }
                seriesRef.current.update({ time: alignedTime, open: haOpen, high: haHigh, low: haLow, close: haClose })
            } else {
                seriesRef.current.update({
                    time: alignedTime,
                    open: Number(data.open), high: Number(data.high),
                    low: Number(data.low), close: Number(data.price),
                })
            }
            setLatestValues(prev => ({ ...prev, price: Number(data.price) }))
        })
        return () => unsubscribe(topic)
    }, [symbol, timeframe, subscribe, unsubscribe])

    return (
        <div className="w-full h-full relative group bg-black">
            <div ref={chartContainerRef} className="w-full h-full" />

            {(status !== 'LIVE' || error) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                    <span className={`text-[8px] font-bold tracking-[0.4em] uppercase ${error ? 'text-red-500' : 'text-white/20 animate-pulse'}`}>
                        {error || status}
                    </span>
                </div>
            )}

            {/* Legend + Controls */}
            <div className="absolute top-7 left-2 flex flex-col gap-1 z-30 p-2.5 bg-black/60 backdrop-blur-md rounded-[3px] border border-white/10 shadow-xl">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[12px] font-bold text-white uppercase tracking-tighter">{symbol}</span>

                    {/* Timeframe picker */}
                    <div className="relative">
                        <button
                            onClick={() => setShowTfMenu(!showTfMenu)}
                            className="bg-black/40 border border-white/5 px-2 py-0.5 rounded-[2px] text-[10px] font-bold text-yellow-500 flex items-center gap-1 hover:bg-white/5 transition-colors"
                        >
                            {timeframe.toUpperCase()}
                            <ChevronDown size={10} className={`transition-transform duration-200 ${showTfMenu ? 'rotate-180' : ''}`} />
                        </button>
                        {showTfMenu && (
                            <div className="absolute top-full left-0 mt-1 bg-[#0a0c10] border border-white/10 shadow-2xl flex flex-col min-w-[54px] rounded-[2px] z-20 overflow-hidden">
                                {TIMEFRAMES.map(tf => (
                                    <button
                                        key={tf.id}
                                        onClick={() => { setTimeframe(tf.id); setShowTfMenu(false) }}
                                        className={`px-2 py-1.5 text-[10px] font-bold uppercase text-left transition-colors ${timeframe === tf.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white/60 hover:bg-white/5'}`}
                                    >
                                        {tf.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chart type switcher */}
                    <div className="flex items-center gap-px border border-white/5 rounded-[2px] overflow-hidden">
                        {CHART_TYPES.map(ct => (
                            <button
                                key={ct.id}
                                onClick={() => setChartType(ct.id)}
                                title={ct.title}
                                className={`px-2 py-0.5 text-[9px] font-bold transition-colors ${chartType === ct.id ? 'bg-white/15 text-white' : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'}`}
                            >
                                {ct.label}
                            </button>
                        ))}
                    </div>

                    {/* Colour pickers */}
                    <div className="flex items-center gap-1" title="Bar colours">
                        <input
                            type="color"
                            value={upColor}
                            onChange={e => setUpColor(e.target.value)}
                            title="Up colour"
                            className="w-4 h-4 rounded-[2px] cursor-pointer border-0 p-0 bg-transparent"
                            style={{ WebkitAppearance: 'none' }}
                        />
                        <input
                            type="color"
                            value={downColor}
                            onChange={e => setDownColor(e.target.value)}
                            title="Down colour"
                            className="w-4 h-4 rounded-[2px] cursor-pointer border-0 p-0 bg-transparent"
                            style={{ WebkitAppearance: 'none' }}
                        />
                    </div>

                    <span className="text-[12px] font-mono text-bull mr-2">{latestValues.price?.toFixed(2)}</span>

                    {/* Indicators button */}
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className={`p-1 rounded-[2px] transition-all flex items-center justify-center ${showMenu ? 'bg-bull text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        title="Indicators"
                    >
                        <Activity size={12} />
                    </button>
                </div>

                {/* Active indicator values */}
                {INDICATORS.map(ind => visibleIndicators.includes(ind.id) && (
                    <div key={ind.id} className="flex items-center gap-2 leading-none">
                        <span className="text-[9px] font-bold uppercase tracking-tight" style={{ color: ind.color ?? '#aaaaaa' }}>{ind.label}:</span>
                        <span className="text-[9px] text-white font-mono">
                            {ind.id === 'BB'
                                ? `${latestValues.bbUpper?.toFixed(1)} / ${latestValues.bbLower?.toFixed(1)}`
                                : ind.id === 'MACD'
                                ? `${latestValues.macd?.toFixed(4)} / ${latestValues.macdSignal?.toFixed(4)}`
                                : ind.id === 'VOLUME'
                                ? (v => v >= 1e6 ? (v/1e6).toFixed(2)+'M' : v >= 1e3 ? (v/1e3).toFixed(2)+'K' : v?.toFixed(2))(latestValues.volume)
                                : latestValues[ind.id.toLowerCase()]?.toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Indicators menu overlay */}
            {showMenu && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm z-50 p-4"
                    onClick={() => setShowMenu(false)}
                >
                    <div
                        className="bg-[#12151c] border border-white/25 shadow-2xl flex flex-col w-full max-w-[280px] max-h-[85%] rounded overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/15 flex items-center justify-between">
                            <span className="text-[13px] font-bold text-white uppercase tracking-widest">Indicators</span>
                            <button onClick={() => setShowMenu(false)} className="text-white/60 hover:text-white transition-colors"><X size={14} /></button>
                        </div>

                        {/* Search */}
                        <div className="px-4 py-3 border-b border-white/10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={12} />
                                <input
                                    type="text"
                                    placeholder="Search indicators..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/15 rounded px-3 pl-8 py-2 text-[12px] text-white placeholder-white/30 focus:outline-none focus:border-white/40 font-mono"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            {filteredIndicators.length === 0 ? (
                                <div className="p-6 text-[11px] text-white/40 text-center uppercase font-bold">No results found</div>
                            ) : filteredIndicators.map(ind => (
                                <button
                                    key={ind.id}
                                    onClick={() => ind.supported && toggleIndicator(ind.id)}
                                    disabled={!ind.supported}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-[11px] font-bold transition-all border-b border-white/5 last:border-0 ${
                                        !ind.supported
                                            ? 'opacity-30 cursor-not-allowed text-white'
                                            : visibleIndicators.includes(ind.id)
                                            ? 'bg-white/10 text-white'
                                            : 'text-white hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex flex-col items-start gap-1">
                                        <div className="flex items-center gap-2">
                                            <span>{ind.label}</span>
                                            {!ind.supported && <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-white/60 font-normal">Soon</span>}
                                        </div>
                                        <span className="text-[9px] text-white/40 leading-none font-normal">{ind.category}</span>
                                    </div>
                                    {visibleIndicators.includes(ind.id) && <div className="w-2 h-2 rounded-full bg-bull shadow-[0_0_6px_rgba(0,255,136,0.8)]" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <span className="text-[6px] text-white/20 uppercase font-mono tracking-tighter">LIVE STOMP-BINANCE</span>
            </div>
        </div>
    )
}

export default TradingChart

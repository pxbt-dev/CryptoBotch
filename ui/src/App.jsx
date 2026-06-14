import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, Menu, Plus } from 'lucide-react'
import TradingChart from './components/TradingChart.jsx'
import OrderBook from './components/OrderBook.jsx'
import RecentTrades from './components/RecentTrades.jsx'
import Sparkline from './components/Sparkline.jsx'

const DEFAULT_MARKETS = [
  { symbol: 'BTCUSDT', icon: '₿' },
  { symbol: 'ETHUSDT', icon: 'Ξ' },
  { symbol: 'SOLUSDT', icon: 'S' },
  { symbol: 'BNBUSDT', icon: 'B' },
  { symbol: 'ADAUSDT', icon: 'A' },
]

function App() {
  const [markets, setMarkets] = useState(DEFAULT_MARKETS)
  const [activeCharts, setActiveCharts] = useState(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'])
  const [focusedSymbol, setFocusedSymbol] = useState('BTCUSDT')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [orderBookHeight, setOrderBookHeight] = useState(50)
  const [searchInput, setSearchInput] = useState('')
  const sidebarContentRef = useRef(null)
  const isResizing = useRef(false)

  useEffect(() => {
    DEFAULT_MARKETS.forEach(m =>
      fetch(`/api/market/subscribe/${m.symbol}`, { method: 'POST' })
    )
  }, [])

  const addMarket = async () => {
    const raw = searchInput.trim()
    if (!raw) return
    let symbol = raw.toUpperCase()
    if (!symbol.endsWith('USDT')) symbol += 'USDT'
    if (markets.find(m => m.symbol === symbol)) {
      setSearchInput('')
      return
    }
    await fetch(`/api/market/subscribe/${symbol}`, { method: 'POST' })
    const icon = symbol.replace('USDT', '')[0]
    setMarkets(prev => [...prev, { symbol, icon }])
    setActiveCharts(prev => [...prev, symbol])
    setFocusedSymbol(symbol)
    setSearchInput('')
  }

  const removeMarket = async (symbol) => {
    await fetch(`/api/market/subscribe/${symbol}`, { method: 'DELETE' })
    setMarkets(prev => prev.filter(m => m.symbol !== symbol))
    setActiveCharts(prev => {
      const next = prev.filter(s => s !== symbol)
      if (focusedSymbol === symbol) setFocusedSymbol(next[0] ?? '')
      return next
    })
  }

  const toggleChart = (symbol) => {
    if (activeCharts.includes(symbol)) {
      if (activeCharts.length > 1) {
        const next = activeCharts.filter(s => s !== symbol)
        setActiveCharts(next)
        if (focusedSymbol === symbol) setFocusedSymbol(next[0])
      }
    } else {
      if (activeCharts.length < 9) {
        setActiveCharts([...activeCharts, symbol])
        setFocusedSymbol(symbol)
      }
    }
  }

  const getGridClass = () => {
    const count = activeCharts.length
    if (count === 1) return 'grid-cols-1 grid-rows-1'
    if (count === 2) return 'grid-cols-2 grid-rows-1'
    if (count <= 4) return 'grid-cols-2 grid-rows-2'
    if (count <= 6) return 'grid-cols-3 grid-rows-2'
    return 'grid-cols-3 grid-rows-3'
  }

  const startResizing = useCallback((e) => {
    isResizing.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResizing)
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const stopResizing = useCallback(() => {
    isResizing.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopResizing)
    document.body.style.cursor = 'default'
    document.body.style.userSelect = 'auto'
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current || !sidebarContentRef.current) return
    const containerRect = sidebarContentRef.current.getBoundingClientRect()
    const relativeY = e.clientY - containerRect.top
    const newHeight = (relativeY / containerRect.height) * 100
    if (newHeight > 20 && newHeight < 80) setOrderBookHeight(newHeight)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex font-mono selection:bg-white/10 overflow-hidden text-[11px]">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-48' : 'w-12'} border-r border-border-dim flex flex-col bg-panel transition-all duration-200 z-30 group/sidebar`}>
        <div className="h-8 flex items-center justify-center border-b border-border-dim bg-background">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-white transition-colors">
            <Menu size={16} />
          </button>
        </div>

        {/* Add coin input — only visible when sidebar is open */}
        {sidebarOpen && (
          <div className="flex items-center gap-1 px-2 py-2 border-b border-border-dim">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMarket()}
              placeholder="BTC, TRUMP…"
              className="flex-1 bg-transparent border border-white/10 rounded px-2 py-1 text-[10px] text-white placeholder-gray-600 focus:outline-none focus:border-white/30 w-0"
            />
            <button
              onClick={addMarket}
              className="text-gray-500 hover:text-white transition-colors shrink-0"
              title="Add coin"
            >
              <Plus size={14} />
            </button>
          </div>
        )}

        <nav className="flex-1 py-2 flex flex-col items-center gap-1 px-1 overflow-y-auto custom-scrollbar">
          {markets.map((market) => (
            <div
              key={market.symbol}
              className={`w-full flex items-center ${sidebarOpen ? 'px-2' : 'justify-center'} py-2 rounded transition-all group/item ${
                activeCharts.includes(market.symbol)
                  ? 'bg-white/5 text-white'
                  : 'text-gray-600 hover:text-gray-300'
              }`}
            >
              <button
                onClick={() => toggleChart(market.symbol)}
                title={market.symbol}
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <span className={`text-xs font-bold shrink-0 ${activeCharts.includes(market.symbol) ? 'text-white' : 'text-gray-700'}`}>
                  {market.icon}
                </span>
                {sidebarOpen && (
                  <>
                    <span className="text-[10px] font-bold tracking-tighter flex-1 text-left truncate">{market.symbol}</span>
                    <Sparkline symbol={market.symbol} color="bull" />
                  </>
                )}
              </button>
              {sidebarOpen && (
                <button
                  onClick={() => removeMarket(market.symbol)}
                  title={`Remove ${market.symbol}`}
                  className="ml-1 text-gray-700 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-all shrink-0"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main board */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-8 border-b border-border-dim flex items-center justify-between px-3 bg-background/90 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white text-black flex items-center justify-center font-black text-[10px]">C</div>
              <span className="text-[9px] font-black tracking-[0.2em] text-white hidden sm:inline uppercase">CW / BOARD</span>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
              <span>Markets / {activeCharts.length}</span>
              <span className="text-white">Focus: {focusedSymbol}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-2 py-0.5 border border-white/10 rounded cursor-pointer hover:bg-white/5">
              <span className="text-[8px] font-bold text-green-500 uppercase tracking-tighter animate-pulse">● Live</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-gray-800"></div>
              <span className="text-[9px] font-bold text-gray-500 uppercase">Trader_01</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className={`flex-1 grid ${getGridClass()} gap-px bg-border-dim p-[1px] overflow-auto`}>
            {activeCharts.map(symbol => (
              <div
                key={symbol}
                onClick={() => setFocusedSymbol(symbol)}
                className={`bg-background relative group overflow-hidden border ${focusedSymbol === symbol ? 'border-white/10' : 'border-transparent'} transition-all cursor-default`}
              >
                <div className={`absolute top-0 left-0 right-0 h-5 bg-black/80 backdrop-blur-sm z-10 flex items-center justify-between px-2 transition-opacity ${focusedSymbol === symbol ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 border-b border-border-dim'}`}>
                  <span className="text-[8px] font-black text-white tracking-widest uppercase">{symbol}</span>
                  <button onClick={(e) => { e.stopPropagation(); toggleChart(symbol) }} className="text-gray-700 hover:text-white">
                    <X size={8} />
                  </button>
                </div>
                <TradingChart symbol={symbol} theme="legacy" />
              </div>
            ))}
          </div>

          <div className="w-60 border-l border-border-dim flex flex-col bg-panel z-10 overflow-hidden" ref={sidebarContentRef}>
            <div style={{ height: `${orderBookHeight}%` }} className="flex flex-col min-h-0 border-b border-border-dim overflow-hidden">
              <OrderBook symbol={focusedSymbol} />
            </div>
            <div
              onMouseDown={startResizing}
              className="h-1.5 w-full bg-white/[0.02] hover:bg-yellow-500/50 cursor-row-resize flex items-center justify-center group transition-colors flex-shrink-0"
            >
              <div className="w-8 h-[1px] bg-white/10 group-hover:bg-white/40 transition-colors"></div>
            </div>
            <div style={{ height: `${100 - orderBookHeight}%` }} className="flex flex-col min-h-0 overflow-hidden">
              <RecentTrades symbol={focusedSymbol} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

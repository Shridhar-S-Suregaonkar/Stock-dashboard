import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  LogOut,
  Mail,
  Eye,
  EyeOff,
  Star,
  BarChart3,
} from "lucide-react";

const STOCKS = [
  { symbol: "GOOG", name: "Alphabet Inc.", basePrice: 140.5 },
  { symbol: "TSLA", name: "Tesla Inc.", basePrice: 242.8 },
  { symbol: "AMZN", name: "Amazon.com Inc.", basePrice: 178.35 },
  { symbol: "META", name: "Meta Platforms Inc.", basePrice: 486.5 },
  { symbol: "NVDA", name: "NVIDIA Corporation", basePrice: 138.25 },
];

const StockBrokerDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [stockPrices, setStockPrices] = useState({});
  const [subscribedStocks, setSubscribedStocks] = useState([]);
  const [sortBy, setSortBy] = useState("symbol");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showWatchlist, setShowWatchlist] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("userEmail");
    const savedSubscriptions = localStorage.getItem("subscribedStocks");

    if (savedEmail) {
      setEmail(savedEmail);
      setIsLoggedIn(true);
    }

    if (savedSubscriptions) {
      setSubscribedStocks(JSON.parse(savedSubscriptions));
    }

    const initialPrices = {};
    STOCKS.forEach((stock) => {
      initialPrices[stock.symbol] = {
        current: stock.basePrice,
        previous: stock.basePrice,
        change: 0,
        changePercent: 0,
        trend: "neutral",
        high: stock.basePrice,
        low: stock.basePrice,
      };
    });
    setStockPrices(initialPrices);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      setStockPrices((prev) => {
        const updated = { ...prev };

        STOCKS.forEach((stock) => {
          const currentPrice = updated[stock.symbol].current;
          const volatility = 0.005;
          const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
          const newPrice = Math.max(
            currentPrice + change,
            stock.basePrice * 0.5
          );

          updated[stock.symbol] = {
            current: newPrice,
            previous: currentPrice,
            change: newPrice - currentPrice,
            changePercent: ((newPrice - currentPrice) / currentPrice) * 100,
            trend:
              newPrice > currentPrice
                ? "up"
                : newPrice < currentPrice
                ? "down"
                : "neutral",
            high: Math.max(updated[stock.symbol].high, newPrice),
            low: Math.min(updated[stock.symbol].low, newPrice),
          };
        });

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    localStorage.setItem("userEmail", email);
    setIsLoggedIn(true);
    setEmailError("");
  };

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    setEmail("");
  };

  const toggleSubscription = (symbol) => {
    const updated = subscribedStocks.includes(symbol)
      ? subscribedStocks.filter((s) => s !== symbol)
      : [...subscribedStocks, symbol];

    setSubscribedStocks(updated);
    localStorage.setItem("subscribedStocks", JSON.stringify(updated));
  };

  const getSortedStocks = useCallback(() => {
    const displayStocks = showWatchlist
      ? STOCKS.filter((s) => subscribedStocks.includes(s.symbol))
      : STOCKS;

    return [...displayStocks].sort((a, b) => {
      let aValue, bValue;

      if (sortBy === "symbol") {
        aValue = a.symbol;
        bValue = b.symbol;
      } else if (sortBy === "price") {
        aValue = stockPrices[a.symbol]?.current || 0;
        bValue = stockPrices[b.symbol]?.current || 0;
      } else if (sortBy === "change") {
        aValue = stockPrices[a.symbol]?.changePercent || 0;
        bValue = stockPrices[b.symbol]?.changePercent || 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [sortBy, sortOrder, stockPrices, showWatchlist, subscribedStocks]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0a] to-[#0a0a0a]"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-[#111111] rounded-xl shadow-2xl border border-[#1f1f1f] p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-xl mb-4 border border-blue-500/20">
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                StockBroker Pro
              </h1>
              <p className="text-[#888888]">Access your trading dashboard</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#666666]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleLogin(e);
                      }
                    }}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#555555] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                {emailError && (
                  <p className="mt-2 text-sm text-red-400">{emailError}</p>
                )}
              </div>

              <button
                onClick={handleLogin}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-blue-600/20"
              >
                Sign In
              </button>
            </div>

            {/* <p className="mt-6 text-center text-sm text-[#666666]">
              No password required • Email format only
            </p> */}
          </div>
        </div>
      </div>
    );
  }

  const sortedStocks = getSortedStocks();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0a0a] to-[#0a0a0a] pointer-events-none"></div>

      <header className="bg-[#111111] border-b border-[#1f1f1f] sticky top-0 z-10 backdrop-blur-xl bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  StockBroker Pro
                </h1>
                <p className="text-sm text-[#888888]">{email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222222] text-[#cccccc] border border-[#2a2a2a] rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Market Overview
              </h2>
              <p className="text-[#888888]">
                Live market data • Updated every second
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowWatchlist(!showWatchlist)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition border ${
                  showWatchlist
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-[#1a1a1a] text-[#cccccc] border-[#2a2a2a] hover:bg-[#222222]"
                }`}
              >
                {showWatchlist ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                <span>Watchlist ({subscribedStocks.length})</span>
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-[#1a1a1a] text-[#cccccc] rounded-lg border border-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="symbol">Sort by Symbol</option>
                <option value="price">Sort by Price</option>
                <option value="change">Sort by Change</option>
              </select>

              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 py-2 bg-[#1a1a1a] text-[#cccccc] border border-[#2a2a2a] rounded-lg hover:bg-[#222222] transition"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedStocks.map((stock) => {
            const priceData = stockPrices[stock.symbol];
            const isSubscribed = subscribedStocks.includes(stock.symbol);

            return (
              <div
                key={stock.symbol}
                className={`bg-[#111111] rounded-lg border transition-all duration-200 ${
                  isSubscribed
                    ? "border-blue-500/50 shadow-lg shadow-blue-500/5"
                    : "border-[#1f1f1f] hover:border-[#2a2a2a]"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-2xl font-bold text-white">
                          {stock.symbol}
                        </h3>
                        {priceData?.trend === "up" && (
                          <div className="flex items-center space-x-1 px-2 py-0.5 bg-green-500/10 rounded text-green-400 text-xs">
                            <TrendingUp className="w-3 h-3" />
                            <span>Live</span>
                          </div>
                        )}
                        {priceData?.trend === "down" && (
                          <div className="flex items-center space-x-1 px-2 py-0.5 bg-red-500/10 rounded text-red-400 text-xs">
                            <TrendingDown className="w-3 h-3" />
                            <span>Live</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[#888888] text-sm">{stock.name}</p>
                    </div>

                    <button
                      onClick={() => toggleSubscription(stock.symbol)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition border ${
                        isSubscribed
                          ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                          : "bg-[#1a1a1a] text-[#cccccc] border-[#2a2a2a] hover:bg-[#222222]"
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isSubscribed ? "fill-current" : ""
                        }`}
                      />
                      <span>{isSubscribed ? "Subscribed" : "Subscribe"}</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-baseline space-x-3 mb-2">
                        <span className="text-4xl font-bold text-white">
                          ${priceData?.current.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span
                          className={`text-sm font-semibold ${
                            priceData?.change > 0
                              ? "text-green-400"
                              : priceData?.change < 0
                              ? "text-red-400"
                              : "text-[#888888]"
                          }`}
                        >
                          {priceData?.change >= 0 ? "+" : ""}$
                          {Math.abs(priceData?.change || 0).toFixed(2)}
                        </span>

                        <span
                          className={`px-2 py-1 rounded text-sm font-semibold ${
                            priceData?.changePercent > 0
                              ? "bg-green-500/10 text-green-400"
                              : priceData?.changePercent < 0
                              ? "bg-red-500/10 text-red-400"
                              : "bg-[#1a1a1a] text-[#888888]"
                          }`}
                        >
                          {priceData?.changePercent >= 0 ? "+" : ""}
                          {priceData?.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#1f1f1f]">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-[#666666] mb-1">Day High</p>
                          <p className="text-white font-semibold">
                            ${priceData?.high.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#666666] mb-1">Day Low</p>
                          <p className="text-white font-semibold">
                            ${priceData?.low.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showWatchlist && subscribedStocks.length === 0 && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl mb-4">
              <Star className="w-8 h-8 text-[#666666]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No stocks in watchlist
            </h3>
            <p className="text-[#888888]">
              Click "Subscribe" on any stock to add it to your watchlist
            </p>
          </div>
        )}
      </main>

      <footer className="mt-16 py-6 border-t border-[#1f1f1f] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[#666666] text-sm">
            Real-time simulation • Updates every second • Client-side only
          </p>
        </div>
      </footer>
    </div>
  );
};

export default StockBrokerDashboard;

#!/usr/bin/env python3
"""Fetch live Yahoo Finance quotes via yfinance. Prints JSON to stdout.

Usage:
  python3 fetch_yahoo_quote.py AAPL
  python3 fetch_yahoo_quote.py AAPL MSFT NVDA
  python3 fetch_yahoo_quote.py --history AAPL 1mo
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone


def fetch_quote(ticker: str) -> dict | None:
    import yfinance as yf

    stock = yf.Ticker(ticker)
    hist = stock.history(period="5d")
    if hist is None or hist.empty:
        return None

    last = hist.iloc[-1]
    first = hist.iloc[0]
    close = float(last["Close"])
    open_ = float(last["Open"]) if "Open" in last and last["Open"] == last["Open"] else close
    high = float(last["High"]) if "High" in last and last["High"] == last["High"] else close
    low = float(last["Low"]) if "Low" in last and last["Low"] == last["Low"] else close
    volume = int(last["Volume"]) if "Volume" in last and last["Volume"] == last["Volume"] else 0
    prev_close = float(hist.iloc[-2]["Close"]) if len(hist) > 1 else float(first["Close"])

    return {
        "tickerSymbol": ticker.upper(),
        "currentPrice": round(close, 2),
        "openingPrice": round(open_, 2),
        "closingPrice": round(prev_close, 2),
        "highPrice": round(high, 2),
        "lowPrice": round(low, 2),
        "volume": volume,
        "asOf": datetime.now(timezone.utc).isoformat(),
    }


def fetch_history(ticker: str, period: str = "1mo") -> list[dict]:
    import yfinance as yf

    hist = yf.Ticker(ticker).history(period=period)
    if hist is None or hist.empty:
        return []

    points = []
    for idx, row in hist.iterrows():
        points.append(
            {
                "date": idx.date().isoformat(),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]) if row["Volume"] == row["Volume"] else 0,
            }
        )
    return points


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(json.dumps({"error": "usage: fetch_yahoo_quote.py TICKER [TICKER...]"}))
        return 1

    if argv[1] == "--history":
        ticker = argv[2].upper()
        period = argv[3] if len(argv) > 3 else "1mo"
        print(json.dumps({"ticker": ticker, "history": fetch_history(ticker, period)}))
        return 0

    quotes = []
    for raw in argv[1:]:
        ticker = raw.strip().upper()
        if not ticker or ticker == "CASH":
            if ticker == "CASH":
                quotes.append(
                    {
                        "tickerSymbol": "CASH",
                        "currentPrice": 1.0,
                        "openingPrice": 1.0,
                        "closingPrice": 1.0,
                        "highPrice": 1.0,
                        "lowPrice": 1.0,
                        "volume": 0,
                    }
                )
            continue
        q = fetch_quote(ticker)
        if q:
            quotes.append(q)

    if len(quotes) == 1:
        print(json.dumps(quotes[0]))
    else:
        print(json.dumps({"quotes": quotes}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

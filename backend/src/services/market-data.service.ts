import axios from 'axios';
import { prisma, logger } from '../index.js';

/**
 * Snapshot of current coffee market conditions
 */
export interface MarketSnapshot {
  arabicaPrice: number | null;    // USD per pound (C-contract)
  arabicaChange: number | null;   // % change from previous close
  usdIdr: number | null;          // 1 USD -> IDR
  eurUsd: number | null;          // 1 EUR -> USD
  gbpUsd: number | null;          // 1 GBP -> USD
  jpyUsd: number | null;          // 1 USD -> JPY
  fetchedAt: string;              // ISO timestamp
  source: string;
}

const CACHE_KEY    = 'market_data_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export class MarketDataService {
  /**
   * Get current market snapshot.
   * Uses PostgreSQL cache if fresh (<1hr), otherwise fetches live data.
   */
  static async getSnapshot(): Promise<MarketSnapshot> {
    // Try cache first
    try {
      const cached = await prisma.setting.findUnique({ where: { key: CACHE_KEY } });
      if (cached) {
        const snap: MarketSnapshot = JSON.parse(cached.value);
        const age = Date.now() - new Date(snap.fetchedAt).getTime();
        if (age < CACHE_TTL_MS) {
          logger.info(`[MarketData] Serving from cache (age: ${Math.round(age / 60000)} min)`);
          return snap;
        }
      }
    } catch (err) {
      logger.warn('[MarketData] Cache read failed, fetching live:', err);
    }

    // Fetch live
    const snap = await this.fetchLive();

    // Persist to cache
    try {
      await prisma.setting.upsert({
        where:  { key: CACHE_KEY },
        update: { value: JSON.stringify(snap) },
        create: { key: CACHE_KEY, value: JSON.stringify(snap) }
      });
    } catch (err) {
      logger.warn('[MarketData] Cache write failed:', err);
    }

    return snap;
  }

  /**
   * Fetch live market data from free public APIs (no API key required)
   */
  private static async fetchLive(): Promise<MarketSnapshot> {
    const snap: MarketSnapshot = {
      arabicaPrice:  null,
      arabicaChange: null,
      usdIdr:        null,
      eurUsd:        null,
      gbpUsd:        null,
      jpyUsd:        null,
      fetchedAt:     new Date().toISOString(),
      source:        'Yahoo Finance + open.er-api.com'
    };

    // 1. Arabica C-Futures (KC=F) from Yahoo Finance
    try {
      const url = 'https://query1.finance.yahoo.com/v8/finance/chart/KC=F?interval=1d&range=5d';
      const { data } = await axios.get(url, {
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NandaraBot/1.0)' }
      });
      const meta   = data?.chart?.result?.[0]?.meta;
      const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close as number[];

      if (meta?.regularMarketPrice) {
        snap.arabicaPrice = parseFloat((meta.regularMarketPrice as number).toFixed(2));
      }
      if (closes && closes.length >= 2) {
        const validCloses = closes.filter((c: number) => c !== null && c !== undefined);
        if (validCloses.length >= 2) {
          const prev = validCloses[validCloses.length - 2];
          const curr = snap.arabicaPrice ?? validCloses[validCloses.length - 1];
          snap.arabicaChange = parseFloat((((curr - prev) / prev) * 100).toFixed(2));
        }
      }
      logger.info(`[MarketData] Arabica KC=F: $${snap.arabicaPrice}/lb (${snap.arabicaChange}%)`);
    } catch (err: any) {
      logger.warn('[MarketData] Yahoo Finance fetch failed:', err.message);
    }

    // 2. Exchange rates from open.er-api.com (completely free, no key)
    try {
      const { data } = await axios.get('https://open.er-api.com/v6/latest/USD', {
        timeout: 8000
      });
      if (data?.rates) {
        snap.usdIdr = parseFloat((data.rates.IDR as number).toFixed(0));
        snap.eurUsd = parseFloat((1 / (data.rates.EUR as number)).toFixed(4));
        snap.gbpUsd = parseFloat((1 / (data.rates.GBP as number)).toFixed(4));
        snap.jpyUsd = parseFloat((data.rates.JPY as number).toFixed(2));
      }
      logger.info(`[MarketData] FX: USD/IDR=${snap.usdIdr}, EUR/USD=${snap.eurUsd}`);
    } catch (err: any) {
      logger.warn('[MarketData] ExchangeRate API fetch failed:', err.message);
    }

    return snap;
  }

  /**
   * Format snapshot as a RAG context block to inject into AI prompts
   */
  static formatAsRagContext(snap: MarketSnapshot): string {
    if (!snap.arabicaPrice && !snap.usdIdr) return '';

    const lines: string[] = ['=== CURRENT COFFEE MARKET DATA ==='];

    if (snap.arabicaPrice !== null) {
      const dir    = (snap.arabicaChange ?? 0) > 0 ? 'UP' : 'DOWN';
      const change = snap.arabicaChange !== null
        ? ` (${dir} ${Math.abs(snap.arabicaChange)}% from yesterday)`
        : '';
      lines.push(`- Arabica C-Futures (NYSE): $${snap.arabicaPrice}/lb${change}`);

      // Approximate FOB Sumatra: futures x 2.2046 (lb->kg) + ~$0.30 origin premium
      const fobEst = (snap.arabicaPrice * 2.2046 + 0.30).toFixed(2);
      lines.push(`- Estimated FOB Sumatra (spot): ~$${fobEst}/kg`);
    }

    if (snap.usdIdr !== null) {
      lines.push(`- USD/IDR exchange rate: ${snap.usdIdr.toLocaleString('id-ID')}`);
    }
    if (snap.eurUsd !== null) lines.push(`- EUR/USD: ${snap.eurUsd}`);
    if (snap.gbpUsd !== null) lines.push(`- GBP/USD: ${snap.gbpUsd}`);
    if (snap.jpyUsd !== null) lines.push(`- USD/JPY: ${snap.jpyUsd}`);

    const ageMin = Math.round((Date.now() - new Date(snap.fetchedAt).getTime()) / 60000);
    lines.push(`(Market data refreshed ${ageMin < 2 ? 'just now' : `${ageMin} minutes ago`})`);
    lines.push('=== END MARKET DATA ===');

    return lines.join('\n');
  }

  /**
   * Return enriched snapshot for the dashboard endpoint
   */
  static async getDashboardData() {
    const snap = await this.getSnapshot();
    return {
      ...snap,
      arabicaPricePerKg: snap.arabicaPrice
        ? parseFloat((snap.arabicaPrice * 2.2046).toFixed(2))
        : null,
      estimatedFobSumatra: snap.arabicaPrice
        ? parseFloat((snap.arabicaPrice * 2.2046 + 0.30).toFixed(2))
        : null,
      marketSentiment: snap.arabicaChange !== null
        ? (snap.arabicaChange > 2 ? 'Bullish' : snap.arabicaChange < -2 ? 'Bearish' : 'Neutral')
        : 'Unknown'
    };
  }
}

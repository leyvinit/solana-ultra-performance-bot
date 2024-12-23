import { Connection, PublicKey } from '@solana/web3.js';
import WebSocket from 'ws';
import fetch from 'node-fetch';
import { performance } from 'perf_hooks';
import { Worker } from 'worker_threads';
import LRU from 'lru-cache';
import ReactDOM from 'react-dom'; // Added import for ReactDOM
import TradeDashboard from './components/trade-dashboard'; // Added import for TradeDashboard


const API_KEY = '4119d893-b43e-47bc-b8fb-2eeac5459824';
const RPC_ENDPOINTS = [
  `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`,
  `https://api.mainnet-beta.solana.com`,
  `https://solana-api.projectserum.com`
];
const WS_ENDPOINT = `wss://mainnet.helius-rpc.com/?api-key=${API_KEY}`;
const PARSE_TX_URL = `https://api.helius.xyz/v0/transactions/?api-key=${API_KEY}`;
const PARSE_HISTORY_URL = `https://api.helius.xyz/v0/addresses/{address}/transactions/?api-key=${API_KEY}`;

const TRACKED_WALLETS = [
  'DfMxre4cKmvogbLrPigxmibVTTQDuzjdXojWzjCXXhzj',
  '8JmasTyaV6YbmYMviV2fprjQ4U6VqBSBa8n2haxe2dHJ'
];

class ConnectionPool {
  private connections: Connection[];
  private currentIndex: number = 0;

  constructor(endpoints: string[]) {
    this.connections = endpoints.map(endpoint => new Connection(endpoint, 'confirmed'));
  }

  getConnection(): Connection {
    const connection = this.connections[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.connections.length;
    return connection;
  }
}

const connectionPool = new ConnectionPool(RPC_ENDPOINTS);

const cache = new LRU<string, any>({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5 minutes
});

async function parseTransactionsBatch(signatures: string[]) {
  const response = await fetch(PARSE_TX_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions: signatures })
  });
  return await response.json();
}

async function parseTransactionHistory(address: string) {
  const cacheKey = `history_${address}`;
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) return cachedResult;

  const url = PARSE_HISTORY_URL.replace('{address}', address);
  const response = await fetch(url);
  const result = await response.json();
  cache.set(cacheKey, result);
  return result;
}

class WebSocketManager {
  private ws: WebSocket;
  private pingInterval: NodeJS.Timeout;
  private pongTimeout: NodeJS.Timeout | null = null;

  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.setupEventListeners();
    this.pingInterval = setInterval(() => this.ping(), 30000);
  }

  private setupEventListeners() {
    this.ws.on('open', this.onOpen.bind(this));
    this.ws.on('message', this.onMessage.bind(this));
    this.ws.on('error', console.error);
    this.ws.on('close', this.onClose.bind(this));
    this.ws.on('pong', this.onPong.bind(this));
  }

  private onOpen() {
    console.log('WebSocket connected');
    TRACKED_WALLETS.forEach(wallet => {
      this.ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'logsSubscribe',
        params: [
          { mentions: [wallet] },
          { commitment: 'confirmed' }
        ]
      }));
    });
  }

  private async onMessage(data: WebSocket.Data) {
    const message = JSON.parse(data.toString());
    if (message.params && message.params.result) {
      const { signature } = message.params.result.value;
      console.log(`New transaction detected: ${signature}`);
      
      const worker = new Worker('./transaction-worker.js', { workerData: signature });
      worker.on('message', (parsedTx) => {
        console.log('Parsed transaction:', JSON.stringify(parsedTx, null, 2));
      });
      worker.on('error', console.error);
    }
  }

  private onClose() {
    console.log('WebSocket disconnected. Reconnecting...');
    setTimeout(() => new WebSocketManager(WS_ENDPOINT), 5000);
  }

  private ping() {
    this.ws.ping();
    this.pongTimeout = setTimeout(() => {
      console.log('WebSocket unresponsive. Closing connection.');
      this.ws.terminate();
    }, 5000);
  }

  private onPong() {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }
}

async function getRecentTransactions() {
  console.log('Fetching recent transactions for tracked wallets...');
  const promises = TRACKED_WALLETS.map(wallet => parseTransactionHistory(wallet));
  const results = await Promise.all(promises);
  TRACKED_WALLETS.forEach((wallet, index) => {
    console.log(`Recent transactions for ${wallet}:`, JSON.stringify(results[index], null, 2));
  });
}

async function main() {
  const startTime = performance.now();

  new WebSocketManager(WS_ENDPOINT);
  await getRecentTransactions();

  const renderDashboard = () => {
    if (typeof window !== 'undefined') {
      const dashboardContainer = document.getElementById('dashboard');
      if (dashboardContainer) {
        ReactDOM.render(<TradeDashboard />, dashboardContainer);
      }
    }
  };

  renderDashboard(); // Added renderDashboard call

  const endTime = performance.now();
  console.log(`Bot initialization completed in ${(endTime - startTime).toFixed(2)}ms`);
}

main().catch(console.error);


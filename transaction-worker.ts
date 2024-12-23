import { parentPort, workerData } from 'worker_threads';
import fetch from 'node-fetch';

const API_KEY = '4119d893-b43e-47bc-b8fb-2eeac5459824';
const PARSE_TX_URL = `https://api.helius.xyz/v0/transactions/?api-key=${API_KEY}`;

async function parseTransaction(signature: string) {
  const response = await fetch(PARSE_TX_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions: [signature] })
  });
  return await response.json();
}

async function processTransaction() {
  const parsedTx = await parseTransaction(workerData);
  if (parentPort) {
    parentPort.postMessage(parsedTx);
  }
}

processTransaction().catch(console.error);


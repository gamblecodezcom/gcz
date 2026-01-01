#!/usr/bin/env node
/**
 * Load testing script for GambleCodez API endpoints
 * Tests: dashboard, wheel, giveaways, affiliate analytics
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS || '10');
const REQUESTS_PER_USER = parseInt(process.env.REQUESTS_PER_USER || '100');
const ENDPOINTS = [
  { path: '/api/profile/dashboard-stats', method: 'GET', weight: 30 },
  { path: '/api/daily-spin/eligibility', method: 'GET', weight: 20 },
  { path: '/api/giveaways', method: 'GET', weight: 15 },
  { path: '/api/raffles', method: 'GET', weight: 15 },
  { path: '/api/sites', method: 'GET', weight: 10 },
  { path: '/api/profile/activity', method: 'GET', weight: 10 },
];

const stats = {
  total: 0,
  success: 0,
  errors: 0,
  responseTimes: [],
  statusCodes: {},
};

function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = new URL(API_BASE + endpoint.path);
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': `test-user-${Math.floor(Math.random() * 1000)}`,
      },
      timeout: 10000,
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        stats.total++;
        stats.responseTimes.push(responseTime);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          stats.success++;
        } else {
          stats.errors++;
        }
        
        stats.statusCodes[res.statusCode] = (stats.statusCodes[res.statusCode] || 0) + 1;
        resolve({ statusCode: res.statusCode, responseTime });
      });
    });

    req.on('error', (error) => {
      stats.total++;
      stats.errors++;
      resolve({ error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      stats.total++;
      stats.errors++;
      resolve({ error: 'timeout' });
    });

    if (endpoint.method === 'POST' && endpoint.body) {
      req.write(JSON.stringify(endpoint.body));
    }
    
    req.end();
  });
}

function selectEndpoint() {
  const totalWeight = ENDPOINTS.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const endpoint of ENDPOINTS) {
    random -= endpoint.weight;
    if (random <= 0) {
      return endpoint;
    }
  }
  
  return ENDPOINTS[0];
}

async function simulateUser(userId) {
  const requests = [];
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    const endpoint = selectEndpoint();
    requests.push(makeRequest(endpoint));
    
    // Small delay between requests
    if (i < REQUESTS_PER_USER - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  await Promise.all(requests);
  console.log(`User ${userId} completed ${REQUESTS_PER_USER} requests`);
}

async function runLoadTest() {
  console.log(`Starting load test:`);
  console.log(`- API Base: ${API_BASE}`);
  console.log(`- Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`- Requests per User: ${REQUESTS_PER_USER}`);
  console.log(`- Total Requests: ${CONCURRENT_USERS * REQUESTS_PER_USER}\n`);

  const startTime = Date.now();
  const users = [];
  
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    users.push(simulateUser(i + 1));
  }
  
  await Promise.all(users);
  const totalTime = Date.now() - startTime;

  // Calculate statistics
  const sortedTimes = stats.responseTimes.sort((a, b) => a - b);
  const avgResponseTime = stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length;
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

  // Calculate additional metrics
  const minResponseTime = sortedTimes[0] || 0;
  const maxResponseTime = sortedTimes[sortedTimes.length - 1] || 0;
  const successRate = (stats.success / stats.total) * 100;
  const errorRate = (stats.errors / stats.total) * 100;
  const throughput = stats.total / (totalTime / 1000);

  console.log('\n=== Load Test Results ===');
  console.log(`Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`Total Requests: ${stats.total}`);
  console.log(`Successful: ${stats.success} (${successRate.toFixed(2)}%)`);
  console.log(`Errors: ${stats.errors} (${errorRate.toFixed(2)}%)`);
  console.log(`Throughput: ${throughput.toFixed(2)} requests/sec`);
  console.log(`\nResponse Times (ms):`);
  console.log(`  Min: ${minResponseTime}`);
  console.log(`  Average: ${avgResponseTime.toFixed(2)}`);
  console.log(`  P50 (Median): ${p50}`);
  console.log(`  P95: ${p95}`);
  console.log(`  P99: ${p99}`);
  console.log(`  Max: ${maxResponseTime}`);
  console.log(`\nStatus Code Distribution:`);
  Object.entries(stats.statusCodes)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([code, count]) => {
      const percentage = ((count / stats.total) * 100).toFixed(2);
      console.log(`  ${code}: ${count} (${percentage}%)`);
    });

  // Performance assessment
  console.log(`\n=== Performance Assessment ===`);
  if (avgResponseTime < 200) {
    console.log('✅ Excellent: Average response time < 200ms');
  } else if (avgResponseTime < 500) {
    console.log('⚠️  Good: Average response time < 500ms');
  } else if (avgResponseTime < 1000) {
    console.log('⚠️  Fair: Average response time < 1s');
  } else {
    console.log('❌ Poor: Average response time > 1s');
  }

  if (successRate >= 99) {
    console.log('✅ Excellent: Success rate >= 99%');
  } else if (successRate >= 95) {
    console.log('⚠️  Good: Success rate >= 95%');
  } else {
    console.log('❌ Poor: Success rate < 95%');
  }

  if (throughput >= 100) {
    console.log('✅ Excellent: Throughput >= 100 req/s');
  } else if (throughput >= 50) {
    console.log('⚠️  Good: Throughput >= 50 req/s');
  } else {
    console.log('⚠️  Fair: Throughput < 50 req/s');
  }
}

runLoadTest().catch(console.error);

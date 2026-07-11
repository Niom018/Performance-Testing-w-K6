import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export const options = {
  scenarios: {
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 },  // ramp up to 10 VUs
        { duration: '30s', target: 10 },  // stay at 10 VUs
        { duration: '20s', target: 25 },  // ramp up to 25 VUs
        { duration: '30s', target: 25 },  // stay at 25 VUs
        { duration: '20s', target: 0 },   // ramp down to 0
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<600'],   // 95% of requests below 600ms
    http_req_failed: ['rate<0.01'],     // failed request rate < 1%
  },
};

export default function () {
  const res = http.get('https://demoqa.com/BookStore/v1/Books', {
    tags: { name: 'Get Books' },
  });

  const body = res.json();

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response contains books': () => body && Array.isArray(body.books) && body.books.length > 0,
    'response time < 600ms': (r) => r.timings.duration < 600,
  });

  if (body && body.books) {
    console.log(`Total Books Returned: ${body.books.length}`);
  }

  console.log(`[Get Books] Status: ${res.status} | Response Time: ${res.timings.duration.toFixed(2)} ms`);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'demoqa-report.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

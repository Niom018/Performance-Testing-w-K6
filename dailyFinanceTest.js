import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const BASE_URL = 'https://dailyfinanceapi.roadtocareer.net';

const adminCredentials = {
  email: 'admin@test.com',
  password: 'admin123',
};

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    'http_req_duration{name:Admin Login}': ['p(95)<600'],
    'http_req_duration{name:Get All Users}': ['p(95)<800'],
    'http_req_duration{name:Get User By ID}': ['p(95)<600'],
  },
};

export default function () {
  // ---------- 1. Admin Login ----------
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(adminCredentials),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Admin Login' },
    }
  );

  check(loginRes, {
    'Login status is 200': (r) => r.status === 200,
  });

  console.log(`[Admin Login] Status: ${loginRes.status} | Response Time: ${loginRes.timings.duration.toFixed(2)} ms`);

  const body = loginRes.json();
  const token = body.token; // confirmed via Postman: top-level "token" field

  if (!token) {
    console.error('Login failed or token not found in response. Stopping test.');
    return;
  }

  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  // ---------- 2. Get All Users ----------
  const usersRes = http.get(`${BASE_URL}/api/user/users`, {
    ...authHeaders,
    tags: { name: 'Get All Users' },
  });

  check(usersRes, {
    'Get All Users status is 200': (r) => r.status === 200,
  });

  console.log(`[Get All Users] Status: ${usersRes.status} | Response Time: ${usersRes.timings.duration.toFixed(2)} ms`);

  // Confirmed via Postman: raw array, no wrapper
  const userList = usersRes.json();

  if (!userList.length) {
    console.error('No users found in response. Stopping test.');
    return;
  }

  // ---------- 3. Randomly select one user ----------
  const randomIndex = randomIntBetween(0, userList.length - 1);
  const selectedUser = userList[randomIndex];

  // ---------- 4. Search that user by ID ----------
  // Confirmed via Postman: ID field is "_id", not "id"
  const userDetailRes = http.get(`${BASE_URL}/api/user/${selectedUser._id}`, {
    ...authHeaders,
    tags: { name: 'Get User By ID' },
  });

  console.log(`[Get User By ID] Status: ${userDetailRes.status} | Response Time: ${userDetailRes.timings.duration.toFixed(2)} ms`);

  const finalUser = userDetailRes.json();

  check(userDetailRes, {
    'Get User By ID status is 200': (r) => r.status === 200,
    'Selected user id matches searched user id': () => finalUser._id === selectedUser._id,
  });

  // ---------- 5. Print selected user's details ----------
  // Confirmed via Postman: no single "name" field — split into firstName / lastName
  console.log('----- Selected User Details -----');
  console.log(`ID: ${finalUser._id}`);
  console.log(`Name: ${finalUser.firstName} ${finalUser.lastName}`);
  console.log(`Email: ${finalUser.email}`);
  console.log(`Phone Number: ${finalUser.phoneNumber}`);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'dailyfinance-report.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

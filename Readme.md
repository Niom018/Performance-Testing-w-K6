# K6 Performance Testing Assignment

**Batch:** Road to SDET — Batch 18
**Topic:** Performance Testing with k6
**Author:** Niamul Hasan

## Overview

This repository contains two k6 performance test scripts:

1. **Daily Finance API Test** — a single-user functional + timing test covering admin login, user list retrieval, and user lookup by ID.
2. **DemoQA BookStore Load Test** — a ramping-load performance test simulating gradually increasing and decreasing virtual users against the DemoQA Books API.

## Tech Stack

- [k6](https://k6.io/) — load testing tool
- [k6-reporter](https://github.com/benc-uk/k6-reporter) — generates HTML summary reports
- JavaScript (k6 test scripts)

## Project Structure

```
k6-assignment/
├── dailyFinanceTest.js       # Question 1 — Daily Finance API
├── demoqaBookStoreTest.js    # Question 2 — DemoQA BookStore ramping load test
├── Reports/                  # Generated HTML reports (gitignored, not committed)
├── .gitignore
└── README.md
```

## Prerequisites

Install k6 on Windows:
```powershell
winget install k6 --source winget
```
Verify installation:
```powershell
k6 version
```

## Question 1: Daily Finance API Test

**File:** `dailyFinanceTest.js`

**Flow:**
1. Admin logs in via `POST /api/auth/login` and extracts the auth token
2. Fetches the full user list via `GET /api/user/users` (Bearer token auth)
3. Randomly selects one user from the list
4. Looks up that user individually via `GET /api/user/<user_id>`
5. Prints the selected user's `_id`, name, email, and phone number
6. Each API call is tagged separately (`Admin Login`, `Get All Users`, `Get User By ID`) so response times and thresholds are tracked per-endpoint

**Validations:**
- All 3 endpoints return status `200`
- The ID from the random selection matches the ID returned by the lookup call

**Thresholds:**
| Tag | Threshold |
|---|---|
| Admin Login | p(95) < 600ms |
| Get All Users | p(95) < 800ms |
| Get User By ID | p(95) < 600ms |

**Run it:**
```powershell
k6 run dailyFinanceTest.js
```

## Question 2: DemoQA BookStore Ramping Load Test

**File:** `demoqaBookStoreTest.js`

**Flow:**
Simulates a ramping traffic pattern against `GET https://demoqa.com/BookStore/v1/Books`:

| Stage | Duration | Target VUs |
|---|---|---|
| Ramp up | 20s | 10 |
| Hold | 30s | 10 |
| Ramp up | 20s | 25 |
| Hold | 30s | 25 |
| Ramp down | 20s | 0 |

Total duration: 2 minutes.

**Validations (per request):**
- Response status is `200`
- Response body contains a non-empty `books` array
- Response time is under 600ms

**Thresholds:**
- 95th percentile response time (`p(95)`) under 600ms
- Failed request rate under 1%

**Run it:**
```powershell
k6 run demoqaBookStoreTest.js
```

## HTML Reports

Both scripts automatically generate an HTML summary report on completion (via `handleSummary()`), saved to the `Reports/` folder:
- `Reports/dailyfinance-report.html`
- `Reports/demoqa-report.html`

The `Reports/` folder is excluded from version control via `.gitignore`.

## Results Summary

Both scripts passed all defined thresholds during test runs:

**Daily Finance API:**
- Admin Login — p(95) ≈ 222ms (threshold: 600ms) ✅
- Get All Users — p(95) ≈ 355ms (threshold: 800ms) ✅
- Get User By ID — p(95) ≈ 70ms (threshold: 600ms) ✅
- 0% failed requests

**DemoQA BookStore:**
- p(95) response time ≈ 200ms (threshold: 600ms) ✅
- 0% failed requests (threshold: <1%) ✅
- 1,464 total requests completed across the ramping load pattern
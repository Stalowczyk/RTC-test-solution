# Real-time Crawlers - Solution

## Overview

This application connects to a sports event simulation API and maintains an internal state manager reflecting the current events and their statuses

- Polls `/api/state` every 1000ms to get the current snapshot of sport events
- Fetches mappings from `/api/mappings` to translate Ids to meaningful names
- Maintains internal state, including removed events (marked as `REMOVED` but not exposed via API)
- Exposes endpoint at `/client/state` on port 4000 to get the current internal state
- Logs all changes in event score and status with old and new values
- Skips and logs any sport events whose mappings cannot be resolved

---

### Requirements

- Docker version >= 23.0.5
- Docker Compose version >= 2.24.6
- Node.js >= 18 (if running locally without Docker)

---

## How to Run

### Using Docker

```bash
git clone https://github.com/Stalowczyk/RTC-test-solution.git
cd RTC-test-solution
docker compose up
```

### Running Locally

```bash
git clone https://github.com/Stalowczyk/RTC-test-solution.git
cd RTC-test-solution
npm install
npm run build
npm start
```

## Common Issues

If you get a MODULE_NOT_FOUND or similar error when running npm start, try the following steps:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
npm start
```

## Main Folder Structure

```
src/
├── fetchers/
│   ├── mappingsFetcher.ts      # Responsible for fetching mapping data from api/mappings
│   └── stateFetcher.ts         # Fetches current state/snapshot data every 1s (1000ms)
│
├── services/
│   └── stateManager.ts         # Central service that manages state updates, diffs, and logic orchestration
│
├── types/
│   ├── event.ts
│   ├── mapping.ts
│   └── simulation.ts
│
├── utils/
│   ├── stateParser.ts          # Functions to parse raw state data into typed, structured objects
│   └── mappingsParser.ts       # Parses raw mapping data into usable in-memory structures
│
└── index.ts                    # Initializes fetchers, services, and coordinates execution
```

\
Thank you for reviewing my solution.\
Feel free to reach out for any questions or clarifications.

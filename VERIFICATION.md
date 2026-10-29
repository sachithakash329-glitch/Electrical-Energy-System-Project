# Preparation verification

Prepared on 28 October 2026. Use this record to distinguish automated checks from actions you still need to perform yourself.

| Check | Status |
|---|---|
| Dependency installation with the supplied versions | Passed for frontend and backend |
| React/Vite production build | Passed |
| Energy/cost calculation tests | 4 passed |
| Server schema/error tests | 6 passed; these run without a connected database |
| Backend JavaScript syntax checks | Passed |
| Browser desktop/mobile interaction and screenshots | Unverified: workspace preview service was unavailable |
| Real MongoDB CRUD/persistence integration | Unverified: temporary local MongoDB could not start in this workspace |
| Your Atlas user, URI, IP access and VS Code setup | Must be configured and checked on your computer |
| Your GitHub repository, submitted report and camera-on video | Must be completed with your own account, identity and evidence |

The attempted MongoDB integration check did not reach the application's CRUD requests. No successful persistence claim is made from that attempt. The backend uses ordinary Mongoose calls, and the guide explains how to run the decisive CRUD/restart checks with your Atlas database. Schema tests do not prove that a room ID exists in a real database; the route checks that when connected.

For reproducible local checks, run `npm ci` then `npm test` in `server`, and `npm ci`, `npm test`, `npm run build` in `client`. Follow `docs/TESTING.md` to verify the remaining runtime behaviour. No supplied screenshots or fabricated student test results are included.

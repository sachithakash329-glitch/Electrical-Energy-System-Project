# Testing checklist

Run the app with your own database before completing this checklist. Record actual outcomes and dates in your report. A successful build is not proof that CRUD or a phone layout works.

## Calculation checks included in the project

From `client`, run `npm test`. Four tests cover:

1. Two 75 W fans operating 8 hours/day for 30 days: 1.2 kWh/day and 36 kWh/month.
2. Appliances with different operating days: summed monthly kWh and fixed charge applied once.
3. Zero daily hours: zero appliance energy.
4. Empty inventory: zero energy while retaining the configured monthly fixed charge.

Run `npm run build` in the same folder to verify the React/Vite source compiles. Run `npm run dev` in both folders for the documented local demonstration. Do not use Vite preview as a replacement for the running Express API.

Run `npm test` in `server` for six additional tests: valid/trimmed appliance input, numeric ranges and integer counts, required room/name, valid zero/decimal hours, nonnegative tariff values, and disconnected-database/malformed-JSON API responses. These tests do not require database credentials and do not claim to test connected CRUD.

## Manual checks on your computer

| ID | Action | Expected result | Your result |
|---|---|---|---|
| T01 | First backend start on a new database | Four rooms, one global settings document, no duplicate seed records | Not recorded |
| T02 | Add the fan example | Success message, persistent row, 36 kWh/month | Not recorded |
| T03 | View a record | Correct room, watts, quantity, hours, days and calculated values | Not recorded |
| T04 | Search `fan` / `FAN` | Same case-insensitive name matches | Not recorded |
| T05 | Select Bedroom filter | Only Bedroom records in the table; household totals unchanged | Not recorded |
| T06 | Change each sort option | Alphabetical name or descending monthly energy/power | Not recorded |
| T07 | Edit fan power from 75 to 100 | Saved values persist; fan energy changes to 48 kWh/month | Not recorded |
| T08 | Click Delete, then Cancel | Record remains unchanged | Not recorded |
| T09 | Click Delete, then confirm | Correct record removed and totals updated | Not recorded |
| T10 | Save rate 30 and fixed charge 100 | For the original fan alone, total LKR 1,180; row LKR 1,080 | Not recorded |
| T11 | Blank/whitespace name, negative W, 25 h/day, fractional quantity/days | Browser or server rejects; no invalid saved record | Not recorded |
| T12 | Refresh browser, then restart backend and refresh again | Saved appliances and tariff remain; rooms do not duplicate | Not recorded |
| T13 | Search for a nonexistent name | Clear no-match state | Not recorded |
| T14 | Delete all test records intentionally | Empty-inventory state; fixed charge alone if configured | Not recorded |
| T15 | Stop backend, refresh frontend | Error message and Retry; works after backend restart | Not recorded |
| T16 | Test 390 px and desktop width | Readable form/cards/nav; table scrolls inside panel | Not recorded |
| T17 | Use Tab/Shift+Tab/Enter | Labelled controls, visible focus, usable actions | Not recorded |
| T18 | Add one record with zero hours/day | Record saved; zero consumption and energy cost | Not recorded |
| T19 | Fresh clone setup | Documented commands work with your private `.env` | Not recorded |

## Optional direct API validation checks

These distinguish server validation from HTML form checks. Use the browser's developer console on the running app at `http://localhost:5173`, or use a REST client. Read and understand any code before pasting it into a developer console. These requests create/change project records only as described.

1. GET the real room ID:

```javascript
const rooms = await fetch('/api/rooms').then(response => response.json());
console.table(rooms);
```

2. Try an invalid create request with 25 hours/day:

```javascript
const response = await fetch('/api/appliances', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Validation test', roomId: rooms[0]._id,
    powerWatts: 75, quantity: 1, hoursPerDay: 25, daysPerMonth: 30
  })
});
console.log(response.status, await response.json());
```

Expected: **400** with a validation message; no record created. Repeat with quantity `1.5`, days `32`, power `0` or a non-number value.

3. Verify malformed and missing IDs without deleting data:

```javascript
const badId = await fetch('/api/appliances/not-an-id');
console.log(badId.status, await badId.json());
const missing = await fetch('/api/appliances/012345678901234567890123');
console.log(missing.status, await missing.json());
```

Expected: **400** for malformed ID and **404** for a valid-shaped ID absent from your database.

For an invalid update test, obtain a real appliance ID from GET `/api/appliances`; send a full PUT record with hours `25`. It should return 400 and leave the previously saved record unchanged. A nonexistent `roomId` must also be rejected. These checks can be recorded with a REST client's response view if required for the report.

## Development verification status

See `VERIFICATION.md` for the checks performed while preparing this package. Your own machine, Atlas credentials, screenshots, mobile checks and final submission are separate checks you must complete. Do not copy the preparation results into a report as if you ran them yourself.

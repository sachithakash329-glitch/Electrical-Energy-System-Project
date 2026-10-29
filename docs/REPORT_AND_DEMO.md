# Report and demonstration preparation

These are preparation notes, not a completed student report. Add your own identity, screenshots, observations and explanations. Never report a test as passed until you have run it. A report PDF and camera-on video are still yours to produce and submit.

## Eight-page report plan

Aim for eight pages so that exporting to PDF does not accidentally exceed the ten-page maximum. Count the cover, screenshots and references as part of the limit unless your lecturer says otherwise. Use readable text, labelled figures and concise explanations rather than inserting every line of source code.

| Page | Suggested contents |
|---|---|
| 1 | Title, your name, index number, course/module, date and a short abstract |
| 2 | Problem, objectives, users, features and boundaries of the flat-rate model |
| 3 | MERN architecture, request flow, folder organisation and main API endpoints |
| 4 | Database ERD and data dictionary; explain the room relationship and singleton tariff |
| 5 | Desktop dashboard/add form and detail/edit screenshots with captions |
| 6 | Mobile view, delete confirmation and validation screenshots with captions |
| 7 | Your actual test results, persistence evidence and one worked calculation |
| 8 | Limitations, possible improvements, conclusion, references and assistance acknowledgement |

Suggested title: **Electrical Energy Consumption and Cost Estimation System: A MERN-Based Household Application**. Keep your registered project title unchanged if your course requires the exact wording.

### Questions to answer in your own words

- What problem does the application solve for a household user?
- Which appliance inputs are necessary, and why?
- How do the four CRUD actions reach MongoDB from React?
- Why is `roomId` a reference rather than a duplicated room name?
- How do type, range, required and whole-number checks prevent invalid records?
- How does the app avoid stale calculated values after editing?
- How did you verify persistence beyond a browser refresh?
- Why is a flat-rate estimate different from an official bill?
- What did you build/change yourself, and which sources or assistance did you use?

### Architecture paragraph prompt

Explain that a browser renders React, React sends JSON requests through `/api`, Node runs Express, and Express uses Mongoose to read/write MongoDB. Responses update React state and the dashboard. Vite's proxy is a development convenience; it is not the database connection. The database URI stays on the backend.

For the database diagram, use the Mermaid ERD in `DATABASE.md`. GitHub renders it. You can capture/export the rendered diagram or recreate it in a diagram tool for your report. Label the optional Room-to-many-Appliance relationship and show settings as an independent global record. Do not pretend MongoDB enforces SQL foreign keys.

### Worked example to verify

Two 75 W fans, 8 hours/day, 30 days/month:

1. Daily operating energy = (75 / 1,000) × 2 × 8 = 1.2 kWh.
2. Monthly energy = 1.2 × 30 = 36 kWh.
3. At illustrative rate LKR 30/kWh, energy charge = 36 × 30 = LKR 1,080.
4. With fixed charge LKR 100/month, total = LKR 1,180.

The energy result is exact for these inputs. Real appliances do not necessarily draw nameplate power continuously, so actual consumption can differ.

### Honest limitations

This is local single-household CRUD software, without login, automatic tariff retrieval, billing slabs, tax calculations, meter readings, billing history or live appliance sensing. Average use is entered manually. Large datasets would need server-side filtering/pagination. These are suitable future improvements, not features you should claim to have implemented.

## Demonstration video plan: target 4 minutes 40 seconds

Keep your camera on throughout. Show the working application and briefly explain the code. Practise once before recording; do not spend your five minutes installing dependencies. Keep all credentials off-screen. Use a spare test appliance so deletion is intentional.

| Time | Show and explain |
|---|---|
| 0:00-0:20 | Introduce yourself, index number, project title and household problem |
| 0:20-0:40 | Explain MongoDB, Express, React and Node roles; point to the main folders |
| 0:40-1:20 | Create two 75 W fans with 8 hours/day and 30 days/month; explain 36 kWh |
| 1:20-1:55 | List/view details, search for fan, filter by room, clear filters and change sort |
| 1:55-2:25 | Edit a value; save and show the updated energy/cost; refresh to show it remains |
| 2:25-2:50 | Delete a test record: cancel once, then confirm; show that it disappears |
| 2:50-3:20 | Show one invalid input and briefly point out server validation in the model/routes |
| 3:20-3:45 | Save an illustrative tariff and show the total; explain fixed charge added once |
| 3:45-4:15 | Briefly show database documents and a backend restart proving persistence |
| 4:15-4:40 | Show mobile layout, GitHub/README/ERD, state limitations and finish |

If restart/network delays risk the time limit, show already-recorded persistence evidence in your testing section and keep the live explanation brief. Do not claim a restart demonstration you did not perform. Play back the finished video and check that screen text, audio and camera are clear. Leave at least 10-20 seconds below the hard five-minute limit.

## Final submission checklist

- [ ] Project runs from a fresh download/clone using the README.
- [ ] Full appliance CRUD works and records survive a backend restart.
- [ ] Detail, search, room filter and all three sort options work.
- [ ] Invalid records are rejected by the browser and server.
- [ ] Database ERD, fields and relationship are documented.
- [ ] Your own desktop/mobile screenshots are included in the README/report.
- [ ] GitHub contains source and lockfiles; credentials and dependencies are absent.
- [ ] You can explain your code and worked calculation without reading a script.
- [ ] Report is at most ten pages after PDF export.
- [ ] Video is at most five minutes and your camera is on.
- [ ] Filenames use your actual index number.
- [ ] Required source/AI assistance acknowledgements follow course rules.
- [ ] Repository link is in the supplied course sheet; marker has access.
- [ ] Report and video are submitted through the lecturer's specified channel by the deadline.

# Start-to-finish guide

This guide assumes Windows and VS Code. The project also runs on macOS/Linux; terminal commands are the same except for the optional file-copy command. Complete the stages in order. You do not need React extensions, a paid database or a paid GitHub account.

This is an assisted learning project. Read the code, make appropriate changes yourself and follow your lecturer's AI-use policy. Simple code cannot guarantee an AI-check result or a particular mark. Do not fabricate a development history or copy explanations you cannot defend.

## 1. Understand what you are building

**MERN** means MongoDB, Express, React and Node.js.

| Part | Role in this project |
|---|---|
| React | The webpage, forms, tables, filters and dashboard |
| Express | API routes that receive browser requests |
| Node.js | Runs the Express server on your laptop |
| MongoDB | Keeps saved appliance records, rooms and tariff settings |

For example, Add appliance sends a POST request to Express; Express validates it and writes a MongoDB document. React shows the returned saved record. Refreshing the page requests saved records again. A browser array alone would not satisfy the persistence requirement.

We use one main CRUD entity, Appliance. Rooms supply a simple one-to-many relationship. Settings hold one global flat rate and fixed charge. Login, charts, IoT hardware, payment processing and deployment are not required by the supplied rubric and are omitted to keep the work manageable.

## 2. Check the rubric and submission rules

| Rubric criterion | Marks | Implemented evidence |
|---|---:|---|
| Create | 4 | Appliance form; POST request; MongoDB insert |
| Read | 4 | Inventory, details, name search, room filter and sorting |
| Update | 4 | Edit form; PUT request; persistent changes |
| Delete | 4 | Named confirmation; DELETE request; record removed |
| Validation/error handling | 2 | Browser constraints, server type/schema checks and messages |
| Database design | 4 | ObjectId keys, typed fields, Room-Appliance relationship and ERD |
| UI/UX/responsiveness | 2 | Navigation, consistent layout, mobile CSS and clear states |
| Code quality/structure | 2 | Models, routes, components, utilities and your genuine Git history |
| Documentation | 2 | README, setup, ERD and your actual UI screenshots |
| Demonstration | 2 | Your explanation and working CRUD demonstration |
| **Total** | **30** | Final marks depend on the assessor and your demonstrated work |

The rubric says a project without working CRUD cannot score above 16 overall. Make CRUD and persistence work before adding anything else.

Submission: repository link through the course Google Sheet; report **maximum 10 pages**; video **maximum 5 minutes**, **camera on**. Rename submitted files using your index number. Deadline in the provided PDF: **on or before 31 October 2026**. The PDF does not specify an exact time; check lecturer announcements. The supplied submission sheet is:

https://docs.google.com/spreadsheets/d/1YrzNdPbmFAZQS0Vow7m3T2jGSa82AAJKqtrYqTZCcA/edit?usp=sharing

## 3. Install the software

1. Install **Node.js 24 LTS** from https://nodejs.org/en/download. Include npm during installation. This project was prepared with Node 24 and declares that major version in its package files.
2. Install **Git** from https://git-scm.com/downloads. On Windows, keep the installer option that makes Git available from the command line and third-party software. The bundled browser sign-in support is useful.
3. Keep your existing **VS Code** installation, or get it from https://code.visualstudio.com/.
4. Create a free GitHub account at https://github.com/ if you do not have one.
5. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas/register.
6. Close and reopen VS Code after installing Node/Git so its terminal receives the updated PATH.

In VS Code, choose **Terminal > New Terminal**. Enter these commands one at a time:

```bash
node -v
npm -v
git --version
```

Expected: a Node version starting `v24`, an npm version and a Git version. If Windows PowerShell blocks `npm.ps1`, use the terminal's dropdown to open **Command Prompt**, or run `npm.cmd` in place of `npm`. You do not need to weaken your computer's execution policy.

## 4. Open the project folder

### Recommended: use the supplied complete files

1. Download the ZIP and right-click **Extract All**. Do not work from inside a ZIP preview.
2. Put the extracted `electrical-energy-system` folder somewhere convenient, such as Desktop.
3. In VS Code, choose **File > Open Folder** and select **electrical-energy-system** itself.
4. Check that the Explorer shows `client`, `server`, `docs`, `README.md` and this guide at the top level.
5. If VS Code asks whether you trust the folder, review the supplied code before choosing your normal workspace trust option.

### If you want to create every file yourself

1. Make an empty folder called `electrical-energy-system` and open it in VS Code.
2. Open `ALL_SOURCE_CODE.md` from the downloaded package separately.
3. In VS Code Explorer use **New Folder** and **New File** to create each exact path in that document, then copy that file's code block into it and save with Ctrl+S. Copy only the code, not the surrounding Markdown fences.
4. Create all files before installing dependencies. Do not run `npm create vite`: the supplied code already includes the complete Vite setup.
5. Use `npm install` rather than `npm ci` for your first installation if you have not copied the lockfiles. npm generates each `package-lock.json` automatically. Commit both lockfiles later.

Common filename mistakes: `App.jsx` is case-sensitive; `.env` must not become `.env.txt`; `package.json` must contain valid JSON without comments. There is deliberately no root `package.json`, so npm commands run inside `server` or `client`.

### Files to recognise

| File | What you should understand |
|---|---|
| `server/package.json` | Backend dependencies and npm scripts |
| `server/.env.example` | Safe template for your private environment settings |
| `server/server.js` | Connect database, start API and close gracefully |
| `server/database.js` | Reuse one connection and create initial rooms/settings |
| `server/app.js` | Configure Express, routes and error handling |
| `server/models/Room.js` | Room names and unique identifiers |
| `server/models/Appliance.js` | Appliance fields and validation rules |
| `server/models/Setting.js` | Global rate and fixed charge |
| `server/routes/appliances.js` | Full CRUD and room-reference checks |
| `server/routes/settings.js` | Read/save tariff settings |
| `client/package.json` | React/Vite dependencies and scripts |
| `client/index.html` | HTML document and React mount point |
| `client/vite.config.js` | Frontend port and API proxy |
| `client/src/main.jsx` | Render App and load CSS |
| `client/src/App.jsx` | Shared data and application actions |
| `client/src/api.js` | JSON requests and API failures |
| `client/src/components/ApplianceForm.jsx` | Add/edit form |
| `client/src/components/ApplianceTable.jsx` | List/search/filter/sort and action buttons |
| `client/src/components/TariffForm.jsx` | Editable cost assumptions |
| `client/src/utils/energy.js` | Energy/cost formulas and formatting |
| `client/src/styles.css` | Layout and mobile rules |
| `client/test/energy.test.js` | Calculation tests |
| `server/test/` | Database-free schema and API error tests |
| `.gitignore` | Exclude dependencies, builds and secrets from Git |

## 5. Create your MongoDB Atlas database connection

The dashboard wording can change, but you need three things: a **Free cluster**, a **database user** and an **IP access-list entry**.

1. Sign in to Atlas and create/select a project, for example `EnergyEstimatorProject`.
2. Create a cluster and choose the **Free** option (sometimes shown as M0). Verify that you selected the free tier before confirming. Choose an available nearby region and a name such as `EnergyCluster`. You do not need sample datasets.
3. In the security setup or **Database Access**, create a database user, such as `energy_student`. This is different from the account you use to sign in to Atlas. Save its password privately. Give it read/write access for this project's database; if the UI offers custom database scope, use `energy_estimator`.
4. In **Network Access / IP Access List**, choose **Add My Current IP Address**. Allow the laptop/network that will run the Express server. If you later switch to a phone hotspot, add that current IP too.
5. At your cluster, choose **Connect > Drivers**, select **Node.js**, and copy the provided `mongodb+srv://...` URI.
6. In VS Code Explorer, copy `server/.env.example`, paste it beside the original and rename the copy to `.env`. Keep `.env.example` unchanged.
7. Put your own copied URI in `.env`. Replace the username/password placeholders with your **database** user credentials and use database name `energy_estimator` before the `?`.

Your local `server/.env` has this shape; the example hostname is not a real cluster:

```dotenv
PORT=5000
MONGODB_URI=mongodb+srv://energy_student:YOUR_ENCODED_PASSWORD@YOUR_ACTUAL_CLUSTER.mongodb.net/energy_estimator?retryWrites=true&w=majority
```

Do not paste that literal example and expect a connection. Preserve your actual Atlas hostname and any options Atlas supplied. Remove placeholder angle brackets. Password characters such as `@`, `:`, `/`, `#`, `?` and `%` must be percent-encoded in a connection URI; do not encode the whole URI. Use a unique strong password and keep the real URI private. Never put it into React, a screenshot, GitHub or a report. No database password is needed in `client`.

You do not need to create collections manually. Starting the backend creates the room and settings documents; adding an appliance creates the appliance collection. If you already have MongoDB Community Server running locally, you can alternatively set `MONGODB_URI=mongodb://127.0.0.1:27017/energy_estimator`. You do not need both local MongoDB and Atlas.

## 6. Initialise Git locally before you customise

Git tracks changes on your laptop. GitHub stores an online copy. Start tracking early so your actual learning and changes are recorded.

Open a terminal in the project root, where `client` and `server` are visible. Configure your identity, replacing the examples:

```bash
git config --global user.name "Your Name"
git config --global user.email "YOUR_GITHUB_EMAIL_OR_NOREPLY_EMAIL"
git init -b main
git status
git check-ignore server/.env
```

After you have created `.env`, the last command should print `server/.env`. If it does not, check the root `.gitignore` before staging anything. Choose the GitHub-provided no-reply email if you prefer not to expose your personal email in public commits.

Then:

```bash
git add .
git status
git commit -m "Add initial MERN energy estimator learning project"
```

Review the staged list: `.env`, `node_modules` and `dist` must not appear. The safe `.env.example` and source files should appear. Both lockfiles are supplied; if reconstructing files manually, commit the generated lockfiles after installation. Describe assisted work honestly in your course-required acknowledgement. Make later commits only for changes you actually make.

## 7. Install and run the backend

1. Choose **Terminal > New Terminal**. Check the prompt is inside the project root. If unsure, right-click the `server` folder in Explorer and choose **Open in Integrated Terminal**, then skip `cd server` below.
2. Run:

```bash
cd server
npm ci
npm run dev
```

Use `npm install` instead of `npm ci` only when constructing the files manually without the supplied lockfile. The install command downloads dependencies into `server/node_modules`. Wait until it completes before starting the server.

Expected terminal output includes:

```text
MongoDB connected.
API ready at http://127.0.0.1:5000
```

Leave this terminal open and running. Open http://127.0.0.1:5000/api/health in your browser. You should see `{"database":"connected"}`. Open http://127.0.0.1:5000/api/rooms to see four saved room records. Opening `/` on this port gives an API route message because React runs separately on port 5173.

If you do not reach this checkpoint, solve the backend problem before running the frontend.

## 8. Install and run the frontend

1. Use the **+** button in the terminal panel to open a **second** terminal. Keep the backend running in the first one.
2. From the project root run:

```bash
cd client
npm ci
npm run dev
```

If the new terminal inherited the `server` directory, run `cd ../client` instead of `cd client`. Or right-click `client` and open its terminal directly, skipping `cd`.

3. Open **http://localhost:5173**.
4. You should see a dashboard with zero appliances, an add form and tariff settings.
5. Your two running processes are now: Express on port 5000 and React/Vite on port 5173. The frontend's `/api` requests are forwarded to port 5000 by `vite.config.js`.

The backend listens only on your laptop. Use your laptop browser or its developer-tools mobile emulator for this assignment, not a phone connecting over Wi-Fi. Hosting is a separate task and is not required in the provided rubric.

## 9. Add a record and check the calculation

Enter these values:

| Field | Value |
|---|---|
| Appliance name | Ceiling fan |
| Room | Bedroom |
| Power per unit | 75 W |
| Quantity | 2 |
| Hours per day | 8 |
| Days per month | 30 |

Click **Add appliance**. The row should appear and the dashboard should show **1.20 kWh daily operating energy** and **36.00 kWh monthly energy**.

In Tariff settings enter **30** as the illustrative rate and **100** as the fixed charge, then click **Save tariff**. The row's energy cost is **LKR 1,080.00** and the dashboard total is **LKR 1,180.00**. This is a calculation example, not a claim about an official tariff.

Add two more sample records through the form:

| Name | Room | W/unit | Quantity | h/day | days/month | Monthly kWh |
|---|---|---:|---:|---:|---:|---:|
| LED lights | Living Room | 10 | 5 | 6 | 30 | 9.00 |
| Electric kettle | Kitchen | 1500 | 1 | 0.25 | 30 | 11.25 |

With all three records, monthly energy is **56.25 kWh** and cost is **LKR 1,787.50** at the example rate and fixed charge. These are sample assumptions. Enter your own realistic appliances and usage for your project screenshots.

## 10. Demonstrate all CRUD operations

1. **Create:** add another appliance and show the success message.
2. **Read:** click View and inspect the full input values. Search `fan`; filter to Bedroom; clear filters and sort by monthly energy. Dashboard totals remain for the whole household, even while the table is filtered.
3. **Update:** edit the two fans from 75 W to 100 W per unit, save, and observe that their monthly energy changes from 36 to **48 kWh**. With only that record, cost becomes **LKR 1,540.00** using rate 30 and fixed charge 100.
4. **Delete safely:** click Delete, cancel once and verify the record remains. Click Delete again, confirm, and verify the row and totals update.
5. **Persistence:** refresh the browser. Then stop the backend with Ctrl+C and restart it with `npm run dev`. Refresh again. Records and saved tariff must remain. MongoDB stores them, not React's temporary state.
6. **Validation:** try blank fields, negative power, quantity 1.5 and 25 hours/day. The browser should reject these. Inspect the server schema and use the optional direct API tests in `docs/TESTING.md` to show that bypassing the form does not bypass server validation.
7. **Database evidence:** in Atlas open the database's collections view/Data Explorer and show `energy_estimator` with room, appliance and settings documents. Do not show the URI or passwords.

## 11. Understand the code before your viva

Read in this order: `energy.js`, the appliance form, the appliance model, appliance routes, `api.js`, `App.jsx`, then the other files.

You should be able to explain:

- Why watts are divided by 1,000 and why quantity is multiplied.
- Why operating days can differ between appliances.
- Why the fixed charge is added once and totals use unrounded numbers.
- What GET, POST, PUT and DELETE do in your project.
- Why you need both browser and server validation.
- Why Room has many Appliances, and what `roomId`/`populate` mean.
- What `useState` holds, what initial `useEffect` does and how `fetch` calls the API.
- Why `.env` is private and `package-lock.json` is committed.
- Why your flat-rate result can differ from an actual electricity bill.

Make a small meaningful change that you understand, such as revising the help text, improving a label, changing the colour palette or adding a simple extra sort option. Test it and record it in a truthful commit. Do not add features solely to make the code look different or to evade similarity checks.

## 12. Run checks and capture your screenshots

In a third terminal opened inside `client`:

```bash
npm test
npm run build
```

Expected: four passing calculation tests and a successful Vite production build. For the backend's six schema/error tests, run `npm test` in a separate terminal inside `server`. These commands finish; they do not replace your two development servers. Complete `docs/TESTING.md` on your own machine as well.

For mobile checks, open browser developer tools (often F12), enable the device toolbar (often Ctrl+Shift+M), choose approximately 390 px width and test forms, messages, navigation and table scrolling. The table scrolls horizontally inside its panel; the page should fit the viewport.

Create the actual screenshots listed in `docs/screenshots/README.md`. Save them into that folder, insert them into the README/report and commit them. Include desktop and mobile views plus edit, delete confirmation and validation evidence. Avoid unrelated personal content and credentials. The report outline and demo script are in `docs/REPORT_AND_DEMO.md`.

## 13. Connect your folder to GitHub

### A. Create an empty online repository

1. Sign in to GitHub in your browser.
2. Choose **+ > New repository**.
3. Name it `electrical-energy-system` and add a short project description.
4. Choose visibility according to your course rules. Public is simplest for a marker to open; private requires granting the marker access.
5. Since your project already has files, leave GitHub's **README**, **.gitignore** and **license** initialisation options unchecked/None. This creates an empty repository and avoids unrelated initial commits.
6. Click **Create repository**, then copy its **HTTPS** URL. It looks like `https://github.com/YOUR_USERNAME/electrical-energy-system.git`.

### B. Link and push from VS Code

Open a terminal at the project root, not inside `client` or `server`. If you have not completed Step 6, do it first. Run these one at a time, replacing YOUR_USERNAME:

```bash
git remote add origin https://github.com/YOUR_USERNAME/electrical-energy-system.git
git remote -v
git push -u origin main
```

If prompted, complete GitHub's browser sign-in. VS Code can prompt for authentication during Git operations. If terminal sign-in is unclear, use **Source Control > ... > Push** or run **Git: Push** from the Command Palette and follow the browser prompt. An extra GitHub extension is not required for basic Git authentication. Do not use your ordinary GitHub password as an HTTPS Git password; use browser sign-in through the installed credential support.

Refresh the repository page. Check that `client`, `server`, docs, README and both lockfiles are there, and **server/.env and node_modules are absent**. Your repository link for submission is `https://github.com/YOUR_USERNAME/electrical-energy-system` without the trailing `.git`.

This uploads source files only. The website continues running locally, and your Atlas database remains separate. Reviewers need the README setup steps and their own `.env`/database access to run it.

### C. Save your later changes

After a real change, run from the project root:

```bash
git status
git diff
git add .
git commit -m "Describe the actual change you made"
git push
```

Good genuine milestones might be improving form validation, documenting your test results or adding your own screenshots. Do not backdate or fabricate commits. Stop any terminal process with Ctrl+C when needed; simply closing VS Code does not save your changes to GitHub.

### D. Verify that someone else can run it

As a final check, download the repository ZIP from GitHub into a different folder or clone it with:

```bash
git clone https://github.com/YOUR_USERNAME/electrical-energy-system.git
```

Stop the original development servers before running this copy to avoid port conflicts. Copy `.env.example` to `.env`, add your own URI privately, install with `npm ci` in both folders and start both servers again. This tests that you did not depend on missing local source files. The clone will see your existing Atlas records if you use the same database URI.

## 14. Finish the report, video and submission

Use `docs/REPORT_AND_DEMO.md` for an eight-page report plan and a 4 minute 40 second video script. Write the report in your own words with your own name, index number, screenshots and observed test results. Export to PDF, then check the actual page count is at most 10, including the cover and references unless your lecturer explicitly says otherwise.

Record the working app with your camera on, keep the video under 5 minutes, play it back and confirm your voice, face and screen are visible. Suggested filenames are `YOUR_INDEX_NUMBER_Report.pdf` and `YOUR_INDEX_NUMBER_Demo.mp4`; replace the placeholder with your actual index number.

Before the stated deadline: submit the GitHub link through the supplied sheet, and submit the report/video through the channel your lecturer specifies. The PDF specifies the sheet for the repository link but does not identify a report/video upload location. Check your LMS or lecturer's announcement for those two items. Confirm that the marker can access your repository and any video link.

## 15. Troubleshooting

| Problem | What to do |
|---|---|
| `node`, `npm` or `git` is not recognised | Install the tool, then reopen VS Code; check PATH/install options. |
| PowerShell says scripts are disabled | Open Command Prompt in VS Code or use `npm.cmd`. |
| npm reports missing `package.json` | Open the correct folder; run install inside `server` or `client`, not the root. |
| `npm ci` reports no lockfile/mismatch | For manual file reconstruction use `npm install`, then keep the generated lockfile; otherwise restore the supplied matching package files. |
| Database setup failed | Check exact `server/.env` filename, URI, database user, password encoding and current Atlas IP entry. Wait for the cluster to be ready. Restart backend after fixing `.env`. |
| DNS/SRV or connection timeout | Check internet access and the Atlas hostname; university networks can block database traffic. Try an allowed network and update the Atlas IP entry for it. |
| Port 5000 already in use | Stop your previous backend terminal. If deliberately choosing another port, change both server `.env` PORT and the Vite proxy target, then restart both. |
| Port 5173 already in use | Stop the earlier frontend process; this project intentionally uses a fixed port. |
| Website shows connection error | Keep both terminals running, visit `/api/health`, inspect the backend output, fix the issue and click Retry connection. |
| Edited rate does not change dashboard | Click Save tariff; only saved values are used in estimates. |
| Empty table after searching | Clear the search and room filter; filters only affect the table. |
| Duplicate-looking records | One record may represent several identical appliances using Quantity; delete your extra test records intentionally. |
| `Author identity unknown` | Set Git user.name and user.email using Step 6, then commit again. |
| `remote origin already exists` | Use `git remote -v`; if wrong, run `git remote set-url origin YOUR_CORRECT_HTTPS_URL`. |
| `src refspec main does not match any` | Create your first commit, then ensure `git branch -M main` and push again. |
| Push rejected because remote has commits | If you initialised GitHub with a README, clone that repository into a new folder and copy your project source into it (exclude `.git`, `.env`, node_modules and dist), then commit/push. Keep your original folder as backup; do not force-push blindly. |
| `.env` was already uploaded | Remove it from tracking with `git rm --cached server/.env`, commit/push, and rotate the database password. Removing the current file does not erase earlier exposure/history. |
| Atlas shows no `appliances` collection | Add your first appliance successfully; MongoDB creates collections on writes. |

For a small local project, the code uses one shared Mongoose connection and the driver's default pool settings. There is no reason to tune pool sizes without workload evidence. If investigating connection problems, use the health endpoint and Atlas connection metrics; check for duplicate backend processes and the IP/user setup first.

## Official references for the setup steps

- Node download: https://nodejs.org/en/download
- Vite requirements: https://vite.dev/guide/
- Atlas free cluster: https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/
- Atlas connection: https://www.mongodb.com/docs/atlas/connect-to-database-deployment/
- Add local code to GitHub: https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github
- GitHub sign-in in VS Code: https://code.visualstudio.com/docs/sourcecontrol/github

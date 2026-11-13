# Installing the Capstone Hub in Canvas (LTI 1.3)

For FAMU Canvas administrators. Do this in the **beta or test** instance first. Replace `https://APP` with the hub's public URL.

## 1. Create the Developer Key

**Admin → Developer Keys → + Developer Key → + LTI Key**

- **Method:** Enter URL
- **JSON URL:** `https://APP/api/lti/config`
- **Redirect URIs:** `https://APP/api/lti/launch`
- Save, then switch the key **ON**.

The configuration requests:

| Setting | Value |
|---|---|
| Privacy level | **Name only**: the tool receives names, never emails |
| Placement | Course Navigation ("Capstone Hub") |
| LTI Advantage scopes | None (no gradebook or roster access) |
| Public JWK URL | `https://APP/api/lti/jwks` |

Note the key's **Client ID** (the number in the Details column, e.g. `10000000000123`).

## 2. Install the tool

**Admin → Settings → Apps → View App Configurations → + App**

- **Configuration Type:** By Client ID
- Paste the Client ID, then Submit and Install.

Open the installed app's settings (⚙ → **Deployment Id**) and copy the **Deployment ID** (e.g. `123:8865aa05b4b79b64a91a86042e43af5ea8ae79eb`).

To limit the pilot, install the tool in a single course or sub-account instead of the root account.

## 3. Register Canvas with the hub

Send the Client ID and Deployment ID to the hub's maintainer. They run:

```bash
npm run lti:register -- --preset canvas-beta --client-id <CLIENT_ID> --deployment-id <DEPLOYMENT_ID>
```

Presets: `canvas` (production), `canvas-beta`, `canvas-test`. Run it once per environment. Launches from unregistered deployments are refused.

## 4. Check it works

Open a course → **Capstone Hub** in the course menu.

- **Teachers and TAs** land on the advisor queue.
- **Students** land on their hub.
- **Observers** see "available to students and instructors of this course only."

## Roles

| Canvas course role | In the hub |
|---|---|
| Teacher, TA, Designer | Advisor |
| Student | Student |
| Observer, or no course role | Not allowed |

Roles are re-read from Canvas on every launch.

## Browser notes

The hub runs inside Canvas's iframe using partitioned cookies. If a browser blocks them anyway (some Safari settings), the hub shows an **"Open Capstone Hub in a new tab"** button. It's a single-use link that expires after 2 minutes.

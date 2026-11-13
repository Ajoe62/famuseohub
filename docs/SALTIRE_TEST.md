# Testing the staging hub with saLTIre (before Canvas)

[saLTIre](https://saltire.lti.app/platform) is a free LTI 1.3 test platform. It plays the part of Canvas, so you can launch the deployed staging hub over the real internet before FAMU issues a Developer Key.

Staging: `https://famuseohub.vercel.app` (replace below if your domain differs).

**Use fictional names only.** saLTIre is a third-party site. Leave the email blank (the hub ignores it anyway).

## 1. Let saLTIre embed the hub (temporary)

The hub only allows Canvas to put it in an iframe. In **Vercel → Settings → Environment Variables**, add (Production):

```
FRAME_ANCESTORS='self' https://*.instructure.com https://saltire.lti.app
```

Redeploy (the header is set at build time). **Remove the variable and redeploy when testing is done.**

## 2. Sign in to saLTIre

Open https://saltire.lti.app/platform and choose **Sign in** (Google). Without signing in, saLTIre's endpoints are tied to a temporary session and change, and the hub's registration would stop matching.

## 3. Enter the tool's details

**Security Model** (left menu), set **LTI version** to **1.3.0**, then in **Tool Details**:

| saLTIre field | Value |
|---|---|
| Message URL | `https://famuseohub.vercel.app/api/lti/launch` |
| Initiate login URL | `https://famuseohub.vercel.app/api/lti/login` (POST or GET both work) |
| Redirection URI(s) | `https://famuseohub.vercel.app/api/lti/launch` |
| Public keyset URL | `https://famuseohub.vercel.app/api/lti/jwks` |

Click **Save**.

## 4. Register saLTIre with the hub

From **Platform Details** on the same page, copy these values. They're all public, so they're safe to paste into chat:

- Platform/Issuer ID
- Client ID
- Deployment ID
- Authentication request URL
- Access Token service URL
- Public keyset URL

The maintainer then runs this from the project folder. `.env.local` points at the staging database:

```bash
npm run lti:register -- --name saLTIre --issuer "<Platform/Issuer ID>" --client-id "<Client ID>" \
  --auth-url "<Authentication request URL>" --token-url "<Access Token service URL>" \
  --jwks-url "<Public keyset URL>" --deployment-id "<Deployment ID>"
```

## 5. Set up the launch

- **Context/Resource:** give the context an **ID** (e.g. `saltire-test-course`) and **Title** (e.g. `Capstone Test Course`), type **CourseOffering**. Give the resource link an **ID**. The hub refuses launches without a course.
- **User:** a fictional **ID**, **Given/Family/Full name**. **Role(s):** pick **Instructor** first.
- **Message:** message type **basic-lti-launch-request** (sent as `LtiResourceLinkRequest` in 1.3).

## 6. Launch and check

Use **Connect → Open in iframe** (this tests third-party cookies, as in Canvas), and also **Open in new window**.

| Launch as | Expected |
|---|---|
| Instructor | Advisor queue for "Capstone Test Course" |
| Learner (change the user **ID** too) | Student hub: choose a track, log hours |
| Instructor again | Sees the learner's pending hours; approve them |
| Mentor | "available to students and instructors of this course only" |
| Relaunch from saLTIre's history (same message) | "The launch expired or was already used" |

If a browser blocks the iframe cookies, the hub shows **Open Capstone Hub in a new tab**. That's expected.

## If something fails

The error page names the reason. The Vercel logs (**Deployments → Logs**, search `[lti]`) have the detail:

| Message | Usually means |
|---|---|
| "isn't registered with the Capstone Hub" | Issuer or Client ID differs from step 4 |
| "installation … isn't registered yet" | Deployment ID differs |
| "couldn't be verified" | Wrong keyset URL, or the token is for another client ID |
| "available to students and instructors … only" | The role isn't a course role. Set Role(s) to `http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor` (or `#Learner`) |
| Blank or refused iframe | `FRAME_ANCESTORS` from step 1 is missing, or wasn't redeployed |

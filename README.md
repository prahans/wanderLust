# WanderLust

### Discover unique stays. Share places worth exploring.

An Airbnb-inspired, full-stack vacation rental listing application built with **Node.js, Express, MongoDB, and EJS**. Explore stays, search by listing name, filter by category, and share reviews. Registered users can publish and manage their own listings with cloud-hosted photos.

![Node.js](https://img.shields.io/badge/Node.js-24.12.0-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)
![EJS](https://img.shields.io/badge/Templates-EJS-B4CA65?logo=ejs&logoColor=white)

**[Live Demo](https://wanderlust-okyq.onrender.com/listings)** · **[Repository](https://github.com/prahans/wanderLust)** · **[Report an Issue](https://github.com/prahans/wanderLust/issues)**

## Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Routes](#routes)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Author and License](#author-and-license)

## Features

- **Browse stays:** View property photos, descriptions, nightly prices, locations, and owner details.
- **Search and filter:** Search listing titles without case sensitivity and combine searches with category filters, including a dedicated Trending filter.
- **Manage listings:** Create listings with photos and categories; edit or delete listings you own.
- **Cloud image storage:** Upload photos through Multer and Cloudinary, with image cleanup when replacing photos or deleting listings.
- **User accounts:** Sign up, log in, and log out with Passport-based authentication and MongoDB-backed sessions.
- **Reviews and ratings:** Leave comments and 1–5 star ratings, and delete your own reviews.
- **Price display toggle:** Switch listing-card prices between the base nightly rate and a total including the application's configured 18% tax.
- **Validation and feedback:** Server-side listing and search validation, ownership checks, flash messages, and shared error pages.
- **Responsive listing grid:** Browse listings in a layout that adapts to screen size.

The current application focuses on listing discovery, publishing, and reviews. Reservations, payments, wishlists, and interactive maps are future enhancements.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Runtime and server | Node.js 24.12.0, Express 5 |
| Views and styling | EJS, ejs-mate, Bootstrap 5, HTML, CSS, JavaScript |
| Database | MongoDB, Mongoose |
| Authentication | Passport, passport-local, passport-local-mongoose |
| Sessions and messages | express-session, connect-mongo, connect-flash |
| Image uploads | Multer, Cloudinary, multer-storage-cloudinary |
| Validation | Joi |
| Development and testing | Nodemon, Node.js built-in test runner |
| Hosting | Render, with configuration in `render.yaml` |

The code follows an MVC structure: routes connect requests to controllers, Mongoose models manage application data, and EJS templates render the pages.

## Getting Started

### Prerequisites

- **Node.js 24.12.0**, matching `package.json`, and npm.
- A **MongoDB** database: MongoDB Atlas or a running local instance.
- A **Cloudinary** account for listing image uploads.
- **Git** to clone the repository.

### 1. Clone and install

```bash
git clone https://github.com/prahans/wanderLust.git
cd wanderLust
npm ci
```

### 2. Configure the environment

Copy the included `.env.example` file to `.env` in the project root:

```bash
cp .env.example .env
```

On Windows, you can copy and rename the file in your editor or file explorer.

Update the values with your own configuration:

```dotenv
PORT=8080
ATLASDB_URL=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/wanderlust?retryWrites=true&w=majority
SECRET=replace-with-a-long-random-secret
CLOUD_NAME=your-cloudinary-cloud-name
CLOUD_API_KEY=your-cloudinary-api-key
CLOUD_API_SECRET=your-cloudinary-api-secret
```

| Variable | Purpose |
| --- | --- |
| `PORT` | Local server port; defaults to `8080` when omitted. |
| `ATLASDB_URL` | MongoDB connection string used for application data and sessions. |
| `SECRET` | Secret used for session signing and session-store encryption. |
| `CLOUD_NAME` | Cloudinary cloud name. |
| `CLOUD_API_KEY` | Cloudinary API key. |
| `CLOUD_API_SECRET` | Cloudinary API secret. |
| `NODE_ENV` | Set to `production` on the host; leave unset or use `development` locally. |

For a local MongoDB instance, set `ATLASDB_URL=mongodb://127.0.0.1:27017/wanderlust`.

Generate a random session secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep `.env` out of version control. For Atlas, use a database user's credentials, URL-encode special characters in the password, and allow your application's network access in the Atlas IP access list.

### 3. Start the application

```bash
npm run dev
```

Open **[http://localhost:8080/listings](http://localhost:8080/listings)**, or use your configured port. The server starts listening after MongoDB connects successfully.

Create an account through **Sign up**, then add your first listing with a photo. An empty database is supported; seeding is optional.

### Optional: sample data

The repository includes `init/data.js` and `init/index.js` for development data.

> **Destructive operation:** The current initialization script deletes all listings in the local `wanderlust` database before inserting sample data. It uses a hard-coded local database URL and owner ID, independently of `ATLASDB_URL`.

Before using it, inspect `init/index.js`, confirm the target is a disposable development database, and replace the owner ID with a valid user ID from that database. Then run:

```bash
node init/index.js
```

Do not use this script as a production build or startup command.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start `app.js` with Nodemon for automatic restarts during development. |
| `npm start` | Start the application with `node app.js`. |
| `npm test` | Run the test suite with `node --test`. |

Tests are located in `tests/` and cover listing behavior, routes, validation, search, category forms, the tax display, and deployment behavior.

## Project Structure

| Path | Responsibility |
| --- | --- |
| `app.js` | Application setup, database connection, sessions, authentication, and server startup. |
| `controllers/` | Listing, review, and user request handlers. |
| `models/` | Mongoose models for listings, reviews, and users. |
| `routes/` | Express routes for listings, reviews, and authentication. |
| `views/` | EJS pages, shared layouts, and reusable partials. |
| `public/` | Static stylesheets and browser JavaScript. |
| `middleware.js` | Authentication, ownership checks, and listing validation. |
| `schema.js` | Joi schemas for request validation. |
| `cloudConfig.js` | Cloudinary configuration and upload storage. |
| `utils/` | Error handling, asynchronous helpers, and listing categories. |
| `init/` | Sample data and the development initialization script. |
| `tests/` | Automated tests using Node.js's built-in test runner. |
| `.env.example` | Environment configuration template. |
| `render.yaml` | Render service configuration. |

## Routes

These are server-rendered application routes; most return HTML or redirects.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/` | Redirect to `/listings`. |
| `GET` | `/listings` | Browse listings; accepts `search` and `category` query parameters. |
| `GET` | `/listings/new` | Show the listing creation form; login required. |
| `POST` | `/listings` | Create a listing with an uploaded image; login required. |
| `GET` | `/listings/:id` | View listing details and reviews. |
| `GET` | `/listings/:id/edit` | Show the edit form; owner only. |
| `PUT` | `/listings/:id` | Update a listing; owner only. |
| `DELETE` | `/listings/:id` | Delete a listing; owner only. |
| `POST` | `/listings/:id/reviews` | Add a review; login required. |
| `DELETE` | `/listings/:id/reviews/:reviewId` | Delete a review; review author only. |
| `GET`, `POST` | `/signup` | Show the signup form or register an account. |
| `GET`, `POST` | `/login` | Show the login form or authenticate a user. |
| `GET` | `/logout` | Log out of the current session. |
| `GET` | `/health` | Return database connection health as JSON. |

HTML forms use `method-override` with the `_method` query parameter for `PUT` and `DELETE` requests.

## Deployment

The project includes a Render Blueprint configuration in [`render.yaml`](render.yaml).

1. Connect the repository to Render and create a service using the included Blueprint.
2. Supply `ATLASDB_URL`, `CLOUD_NAME`, `CLOUD_API_KEY`, and `CLOUD_API_SECRET` when configuring the service. The Blueprint sets `NODE_ENV=production` and generates `SECRET`.
3. Allow the service's outbound IP ranges in your MongoDB Atlas IP access list.
4. Deploy, then verify `/listings` and `/health` on the service URL.

For a manually configured Render Web Service, use:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check path | `/health` |
| Environment | `NODE_ENV=production`, database and Cloudinary values, and a stable random `SECRET` |

Render supplies the service port. In production, the application reads environment variables from the host rather than loading `.env`, trusts the reverse proxy, and enables secure session cookies.

The health endpoint returns HTTP `200` with `{"status":"ok"}` when MongoDB is connected, or HTTP `503` with `{"status":"unavailable"}` when it is disconnected after startup. If the initial database connection fails, the application exits before accepting requests.

## Contributing

Contributions and bug reports are welcome.

1. Fork the repository and create a focused branch.
2. Make your changes and add or update tests where appropriate.
3. Run `npm test` and check the affected application flow locally.
4. Open a pull request describing the change and how you verified it.

For bug reports, include steps to reproduce, expected behavior, and relevant error messages. Remove credentials and other secrets before sharing logs.

## Author and License

Created by **Prahan Panuhar** — [@prahans](https://github.com/prahans).

The project declares **ISC** licensing in [`package.json`](package.json).

WanderLust is an educational project inspired by Airbnb and is not affiliated with or endorsed by Airbnb.

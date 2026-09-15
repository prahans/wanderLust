# 🏡 WanderLust

WanderLust is a full-stack vacation rental platform inspired by Airbnb. Users can explore unique stays, view property details, create and manage listings, and securely authenticate to access personalized features.

> 🚧 This project is currently under active development.

---

## ✨ Features

- 🔐 User Authentication (Signup & Login)
- 🏠 Browse Vacation Listings
- 📍 View Property Details
- ➕ Create New Listings
- ✏️ Edit Existing Listings
- 🗑 Delete Listings
- 🖼 Upload Property Images
- 💬 Leave Reviews & Ratings
- 👤 User Profiles
- 🔒 Protected Routes
- 📱 Responsive Design

---

## 📁 Project Structure

```
wanderlust/
│
├── public/
├── views/
├── routes/
├── controllers/
├── models/
├── middleware/
├── utils/
├── app.js
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/prahans/wanderLust.git
```

```bash
cd wanderLust
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env` file

Example:

```env
PORT=8080

ATLASDB_URL=your_mongodb_atlas_connection_string

SECRET=your_session_secret

CLOUD_NAME=your_cloudinary_name

CLOUD_API_KEY=your_cloudinary_api_key

CLOUD_API_SECRET=your_cloudinary_api_secret
```

### 4. Start the application

```bash
npm start
```

or

```bash
npm run dev
```

## Deploy to Render

This project uses a Render **Web Service**, MongoDB Atlas for data and sessions,
and Cloudinary for uploaded photos. Node.js is pinned in `package.json`.

### 1. Push your changes to GitHub

Include `package.json`, `package-lock.json`, `app.js`, and `render.yaml`.
Keep `.env` private; `.env.example` lists the required variables without credentials.

### 2. Create the service

In the [Render dashboard](https://dashboard.render.com), choose **New > Blueprint**,
connect this repository, and use the included `render.yaml`. It selects the Free
plan, configures the commands below, and generates `SECRET`. Enter your Atlas and
Cloudinary values when prompted.

If you already started creating a service manually, choose **New > Web Service**
and use these settings instead:

| Setting | Value |
| --- | --- |
| Language / runtime | Node |
| Branch | The branch containing your deployment changes |
| Root directory | Leave blank |
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check path | `/health` |

For a manual service, add these variables under **Environment**:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `ATLASDB_URL` | Your Atlas connection string, including the database name, such as `/wanderlust` before `?` |
| `SECRET` | A long random secret; keep it stable between deployments |
| `CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUD_API_KEY` | Your Cloudinary API key |
| `CLOUD_API_SECRET` | Your Cloudinary API secret |

Generate a session secret locally with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Render supplies `PORT` automatically. Use the Atlas database user's credentials
in the connection string, and URL-encode special characters in its password.
Reusing your existing Atlas database keeps its existing listings and users.

### 3. Allow Render to connect to Atlas

Open your Render service's **Connect > Outbound** tab and copy every listed IP
range. Add those ranges to the Atlas project's **Network Access / IP Access List**.
The service can use any address in these ranges. If the first deployment fails
before you finish this step, redeploy after Atlas applies the entries.

### 4. Verify the deployment

After deployment, open the service's `https://...onrender.com` URL. The homepage
redirects to `/listings`, and `/health` returns `{"status":"ok"}` while MongoDB is
connected. Check signup, login, photo uploads, and review deletion in the browser.

The app waits for MongoDB before listening. A database connection error in Render's
logs usually means the Atlas URL, database credentials, or IP access list needs
attention. Do not use `node init/index.js` as a build command: that development
script deletes listings and uses a local database.

Free services sleep after 15 minutes without traffic, so the next visit can take
about a minute to load. Listings and sessions remain in Atlas; photos remain in
Cloudinary.

References: [Render Express setup](https://render.com/docs/deploy-node-express-app),
[Blueprint configuration](https://render.com/docs/blueprint-spec),
[Render outbound IPs](https://render.com/docs/outbound-ip-addresses),
[Atlas IP access lists](https://www.mongodb.com/docs/atlas/security/ip-access-list/),
[Free service limits](https://render.com/docs/free).

---

## 📌 Current Progress

- ✅ Authentication
- ✅ CRUD Operations
- ✅ Property Listings
- ✅ Image Uploads
- ✅ Reviews & Ratings
- ✅ Authorization
- ✅ Responsive UI
- 🚧 Booking System
- 🚧 Wishlist
- 🚧 Search & Filters
- 🚧 Maps Integration

---

## 🎯 Future Improvements

- Booking & Reservations
- Wishlist
- Search & Filtering
- Interactive Maps
- Payment Integration
- User Dashboard
- Notifications
- Favorites
- Admin Panel

---

## 📚 What I Learned

This project helped me improve my understanding of:

- Full-Stack Web Development
- RESTful APIs
- Authentication & Authorization
- CRUD Operations
- Database Modeling
- Image Upload & Storage
- MVC Architecture
- Session Management
- Form Validation
- Responsive Design

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

Feel free to fork the repository and submit a pull request.

---

## ⭐ Support

If you found this project helpful, consider giving it a ⭐ on GitHub.

---

## 📄 License

This project is for educational purposes only.

The design is inspired by Airbnb and is **not affiliated with or endorsed by Airbnb**.

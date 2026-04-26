# Jalaloaded Full-Stack Application

A Nigerian-style blog and media platform built with Next.js 14, MongoDB, Cloudinary, and Tailwind CSS.

## Features Included (Phase 1)
- **Flexible Media Engine:** Handles 1-5 photos, MP4 videos, and exact Youtube embedding in a smooth mixed-media block. Drag-and-drop support for admin.
- **Global Music Player:** Context-driven player that sits at the bottom and persists across page navigation. Includes track visualization parsing from the `ISong` schema.
- **Real-Time Live Scores:** Animated ticker bar replicating the design with mock live data.
- **Dynamic Threaded Comments:** Complete recursive comment component.
- **Design Accuracy:** Perfect reproduction of the provided `.html` prototypes, fully responsive down to mobile.

## Environment Variables Setup
Rename `.env.local.example` to `.env.local` or edit the existing `.env.local` and add the following keys:
```env
MONGODB_URI=mongodb+srv://<USER>:<PASS>@cluster.mongodb.net/jalaloaded
CLOUDINARY_CLOUD_NAME=your_cloud_url
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
*Note: The images on the About page and avatar endpoints look for `/avatars/jalal.jpg` and `/avatars/co-friend.jpg`. Be sure to populate your public folder.*

## Startup
After installing packages (`npm install`):
```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Deployment to Vercel
1. Push this repository to GitHub.
2. Sign in to Vercel and create a new project from your repository.
3. Once selected, Vercel will automatically detect `Next.js`.
4. In the Environment Variables section, copy/paste your `MONGODB_URI` and `CLOUDINARY_*` keys.
5. Click **Deploy**. Since we use `Next.js App Router` and standard Mongoose schemas, everything runs cleanly within Vercel serverless limits.

# Sales Analytics Dashboard


A responsive dashboard displaying sales data with sorting and pagination capabilities.

## ✨ Features

- 🔢 **Pagination** - Load data in pages (3 records per page)
- 🔼🔽 **Column Sorting** - Click headers to sort by sales/date
- 📊 **Interactive Chart** - Visualize monthly sales trends
- 🔒 **User-Specific Data** - Only shows records for logged-in user
- **Date Range Filtering**
  - Filter records by "Date Recorded" range
  - Clear filters with one click
## 🛠 Tech Stack

- **Frontend**: Next.js, Tailwind CSS
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication

## 🔧 Setup

1. **Firestore Indexes** *(required for sorting)*:
   ```bash
   Collection: dashboardData
   Fields: userId (ASC), createdAt (DESC)
   Fields: userId (ASC), sales (DESC)
   Fields: userId (ASC), sales (ASC)
## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```


# EcoWisely Frontend

A mobile-first Next.js application for tracking and reducing carbon footprint.

## Features

- 📱 **Mobile-Only Design** - Optimized exclusively for mobile devices
- 🎨 **Modern UI** - Built with Tailwind CSS and smooth animations
- 📊 **Carbon Tracking** - Log and visualize your daily carbon emissions
- 💡 **Smart Recommendations** - Get personalized eco-friendly tips
- 🧭 **Bottom Navigation** - App-like navigation experience

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **HTTP Client**: Axios

## Project Structure

```
ecowisely-frontend/
├── app/
│   ├── layout.js              # Root layout with navigation
│   ├── page.js                # Dashboard page
│   ├── log-activity/          # Activity logging page
│   ├── recommendations/       # Recommendations page
│   └── api/activities/        # API proxy routes
├── components/
│   ├── ActivityLogger.js      # Activity form component
│   ├── CarbonChart.js         # Chart visualization
│   ├── RecommendationCard.js  # Recommendation display
│   ├── ProgressBar.js         # Progress indicator
│   ├── ActivityHistory.js     # Activity list
│   └── Navigation.js          # Bottom tab navigation
├── lib/
│   ├── api.js                 # API service layer
│   └── constants.js           # App constants
├── styles/
│   └── globals.css            # Global styles
└── public/
    └── icons/                 # App icons
```

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Run development server
npm run dev
```

Open your mobile device browser and navigate to the local network URL shown in the terminal (e.g., `http://192.168.1.x:3000`).

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
FLASK_API_URL=http://localhost:5000/api
```

## Features Overview

### Dashboard
- Daily, weekly, and monthly carbon emission stats
- Progress bars showing goal achievement
- Interactive charts for emission trends
- Recent activity history
- Daily eco tips

### Log Activity
- Multiple activity types: Transport, Energy, Food, Waste
- Visual selection with icons
- Real-time carbon emission calculation
- Date selection and notes
- Success feedback

### Recommendations
- Personalized eco-friendly tips
- Filter by active/completed status
- Impact and difficulty indicators
- Mark recommendations as complete
- Category-based organization

### Navigation
- Fixed bottom tab navigation
- Highlighted center action button
- Active state indicators
- Touch-optimized interactions

## Mobile Optimization

- Maximum width constraint (430px)
- Touch-friendly button sizes
- Smooth animations and transitions
- Safe area insets for notched devices
- Disabled text selection for app-like feel
- Active touch feedback
- Responsive to device orientation

## API Integration

The app includes a proxy layer in `/app/api/activities/route.js` that forwards requests to your Flask backend. Update the `FLASK_API_URL` environment variable to point to your backend server.

### API Endpoints

- `GET /api/activities` - Fetch all activities
- `POST /api/activities` - Create new activity
- `PUT /api/activities` - Update activity
- `DELETE /api/activities?id=<id>` - Delete activity

## Customization

### Colors

Edit `tailwind.config.js` to change the primary color scheme:

```js
colors: {
  primary: {
    500: '#22c55e', // Main brand color
    // ... other shades
  },
}
```

### Carbon Goals

Modify goals in `lib/constants.js`:

```js
export const CARBON_GOALS = {
  DAILY: 16.4,   // kg CO2e per day
  WEEKLY: 114.8,
  MONTHLY: 492,
}
```

## Notes

- This app is designed **exclusively for mobile devices**
- Desktop users will see a message to use a mobile device
- The app uses mock data by default - connect to your backend API for real data
- Icons should be added to `/public/icons/` directory for PWA support

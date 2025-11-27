# Kolek-Ta: Waste Collection Management System

A web-based waste collection management system with geospatial optimization and interactive mapping capabilities.

## Features

- **Interactive Map**: Real-time visualization of waste bins using Leaflet.js
- **Geospatial Optimization**: Route optimization using nearest neighbor algorithm
- **Bin Management**: Track bin status, capacity, and collection history
- **Route Planning**: Create and optimize collection routes
- **Statistics Dashboard**: Monitor collection metrics and performance

## Tech Stack

- **Backend**: Node.js, Express, MongoDB
- **Frontend**: HTML, CSS, JavaScript
- **Mapping**: Leaflet.js with OpenStreetMap
- **Database**: MongoDB with geospatial indexing

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start MongoDB (ensure MongoDB is running locally or update MONGODB_URI)

4. Run the application:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

5. Open browser to `http://localhost:3000`

## API Endpoints

### Bins
- `GET /api/bins` - Get all bins
- `POST /api/bins` - Create new bin
- `PUT /api/bins/:id` - Update bin
- `GET /api/bins/nearby` - Find nearby bins

### Routes
- `GET /api/routes` - Get all routes
- `POST /api/routes/optimize` - Create optimized route

### Collections
- `GET /api/collections` - Get collection history
- `POST /api/collections` - Record new collection
- `GET /api/collections/stats` - Get statistics

## Usage

1. **Add Bins**: Click "Add Bin" to place waste bins on the map
2. **Select Bins**: Click on map markers to select bins for route optimization
3. **Optimize Route**: Click "Optimize Route" to generate the most efficient collection path
4. **View Stats**: Monitor collection statistics and bin status

## License

MIT

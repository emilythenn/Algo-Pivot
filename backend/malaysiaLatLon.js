// malaysiaLatLon.js
// Mapping of Malaysia state/district to latitude/longitude for OpenWeather API
// Source: https://www.geonames.org/ or similar public datasets
// Only a few samples shown; expand as needed for all districts

module.exports = {
  "Kedah": {
    "Kota Setar": { lat: 6.1238, lon: 100.3601 },
    // ... add all districts
  },
  "Pulau Pinang": {
    "Timur Laut": { lat: 5.4164, lon: 100.3327 },
    // ... add all districts
  },
  "Wilayah Persekutuan Kuala Lumpur": {
    "Kuala Lumpur": { lat: 3.139, lon: 101.6869 },
  },
  "Wilayah Persekutuan Putrajaya": {
    "Putrajaya": { lat: 2.9264, lon: 101.6964 },
  },
  "Wilayah Persekutuan Labuan": {
    "Labuan": { lat: 5.2831, lon: 115.2308 },
  },
  // ... add all states/districts
};

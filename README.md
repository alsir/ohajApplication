# ohajApplication

A React Native (Expo) app that tracks your GPS location and sends it to a server every minute.

## Features

| Tab | Description |
|-----|-------------|
| **Home** | Start / stop location tracking; shows the last sent position |
| **Map** | Displays your current position on an interactive map |
| **History** | Scrollable list of the 50 most-recently sent location records |

## Tech Stack

- **Expo SDK 55** (React Native 0.83)
- **React Navigation 6** – bottom tab navigator
- **expo-location** – foreground GPS access
- **react-native-maps** – interactive map view
- **axios** – HTTP client for posting location records

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Expo CLI (`npm install -g expo-cli`) or use `npx expo`
- Expo Go app on your device **or** an Android/iOS simulator

### Install

```bash
npm install
```

### Configure the server endpoint

Open `src/services/locationService.ts` and replace the placeholder URL:

```ts
const SERVER_ENDPOINT = 'https://your-server.example.com/api/location';
```

### Run

```bash
# Start Expo dev server
npm start

# Open on a specific platform directly
npm run android
npm run ios
npm run web
```

## Project Structure

```
src/
  navigation/
    AppNavigator.tsx    # Bottom-tab navigator
  screens/
    HomeScreen.tsx      # Start/stop tracking UI
    MapScreen.tsx       # Map with last known position
    HistoryScreen.tsx   # List of sent location records
  services/
    locationService.ts  # Location polling & HTTP logic
App.tsx                 # Root component
app.json                # Expo config (permissions included)
```

## Permissions

The app requests **foreground location** permission at runtime.  
Both `app.json` and runtime permission requests are pre-configured.

## Payload Sent to Server

Each POST to the configured endpoint contains JSON like:

```json
{
  "id": "1716290000000",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "accuracy": 10,
  "timestamp": 1716290000000,
  "sentAt": "2026-05-21T10:00:00.000Z"
}
```

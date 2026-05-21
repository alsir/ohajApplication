# Copilot Instructions

## Project Overview
React Native (Expo) app with three pages that sends the device's GPS location to a server every minute.

## Stack
- **Framework**: Expo (React Native)
- **Navigation**: React Navigation v6 (Bottom Tabs)
- **Location**: expo-location
- **HTTP**: axios

## Pages
1. **Home** – app info, start/stop location tracking
2. **Map** – displays current location on a map (expo-maps / react-native-maps)
3. **History** – list of recently sent location records

## Key Rules
- Location is sent every 60 seconds via a background interval.
- Permissions are requested at runtime.
- Keep all screens in `src/screens/`.
- Shared components go in `src/components/`.
- Location logic lives in `src/services/locationService.ts`.

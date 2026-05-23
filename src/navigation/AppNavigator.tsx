import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CarScreen from '../screens/CarScreen';

const Tab = createBottomTabNavigator();

const TABS: Record<string, { icon: string; label: string }> = {
  Home:    { icon: '🏠', label: 'الرئيسية' },
  Car:     { icon: '🚗', label: 'السيارة' },
  History: { icon: '📋', label: 'السجل' },
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{TABS[route.name].icon}</Text>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={[
              tabStyles.label,
              focused ? tabStyles.labelActive : tabStyles.labelInactive,
            ]}>{TABS[route.name].label}</Text>
          ),
          tabBarStyle: tabStyles.bar,
          tabBarItemStyle: tabStyles.item,
          headerStyle: { backgroundColor: '#0d1b2a', borderBottomWidth: 0, elevation: 0, shadowOpacity: 0 },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '800', fontSize: 16 },
          headerTitleAlign: 'center',
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Car" component={CarScreen} options={{ title: 'ربط السيارة' }} />
        <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'سجل المواقع' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    backgroundColor: '#0d1b2a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    height: 70,
    paddingBottom: 10,
  },
  item: { paddingTop: 8 },
  label: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  labelActive: { color: '#38bdf8' },
  labelInactive: { color: 'rgba(255,255,255,0.30)' },
});

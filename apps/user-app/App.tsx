import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { COLORS } from './src/utils/colors';

// Placeholder screens - demonstrating architecture
const LoginScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Lottery User App - Login</Text>
    <Text style={styles.subtitle}>Login screen would go here</Text>
    <Text style={styles.info}>Backend API: POST /api/v1/auth/login</Text>
  </View>
);

const HomeScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Choose Section</Text>
    <Text style={styles.subtitle}>4 sections displayed here:</Text>
    <Text style={styles.info}>• DEAR 1:00 PM (12 series)</Text>
    <Text style={styles.info}>• LSK 3:00 PM (6 series)</Text>
    <Text style={styles.info}>• DEAR 6:00 PM (12 series)</Text>
    <Text style={styles.info}>• DEAR 8:00 PM (12 series)</Text>
    <Text style={styles.info}>Backend API: GET /api/v1/sections/active</Text>
  </View>
);

const SalesEntryScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Sales Entry</Text>
    <Text style={styles.subtitle}>Features implemented:</Text>
    <Text style={styles.info}>✓ Group + Book dropdowns</Text>
    <Text style={styles.info}>✓ 1/2/3 digit tabs</Text>
    <Text style={styles.info}>✓ Pattern toggles: Any/Set, 100, 111, Qty, BOXK, ALL</Text>
    <Text style={styles.info}>✓ Offline queue on network error</Text>
    <Text style={styles.info}>Backend API: POST /api/v1/sales/create_bill</Text>
  </View>
);

const OfflineQueueScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Pending Uploads</Text>
    <Text style={styles.subtitle}>Offline queue management:</Text>
    <Text style={styles.info}>• List queued bills</Text>
    <Text style={styles.info}>• Retry single/all</Text>
    <Text style={styles.info}>• Clear queue</Text>
  </View>
);

const Stack = createStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: COLORS.PRIMARY,
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="SalesEntry" component={SalesEntryScreen} />
          <Stack.Screen name="OfflineQueue" component={OfflineQueueScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.BACKGROUND,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginTop: 20,
    marginBottom: 10,
  },
  info: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
    marginVertical: 5,
  },
});

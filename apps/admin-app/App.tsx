import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, View, Text, StyleSheet } from 'react-native';

const COLORS = {
  PRIMARY: '#AA292E',
  ACCENT: '#F19826',
  BACKGROUND: '#FFFFFF',
  TEXT: '#000000',
  TEXT_LIGHT: '#666666',
};

// Placeholder screens - demonstrating architecture
const LoginScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Lottery Admin App - Login</Text>
    <Text style={styles.subtitle}>Admin login with role guard</Text>
    <Text style={styles.info}>Backend API: POST /api/v1/auth/login</Text>
    <Text style={styles.info}>Requires role: ADMIN</Text>
  </View>
);

const DashboardScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Admin Dashboard</Text>
    <Text style={styles.subtitle}>Quick stats and actions</Text>
  </View>
);

const MastersScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Masters Management</Text>
    <Text style={styles.subtitle}>CRUD for:</Text>
    <Text style={styles.info}>• Sections (with series_config editor)</Text>
    <Text style={styles.info}>• Schemes (rates and commissions)</Text>
    <Text style={styles.info}>• Sales Groups/Books</Text>
    <Text style={styles.info}>• Users + Roles</Text>
    <Text style={styles.info}>• Ticket Books/Assignments</Text>
    <Text style={styles.info}>• Blocked Numbers/Rules</Text>
    <Text style={styles.info}>• Credit Limits</Text>
  </View>
);

const ResultPublishScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Result Publish</Text>
    <Text style={styles.subtitle}>Features:</Text>
    <Text style={styles.info}>✓ Section selector</Text>
    <Text style={styles.info}>✓ Date picker</Text>
    <Text style={styles.info}>✓ Winning number input</Text>
    <Text style={styles.info}>✓ Publish with confirmation</Text>
    <Text style={styles.info}>✓ Automatic settlement trigger</Text>
    <Text style={styles.info}>Backend API: POST /api/v1/results/publish</Text>
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
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Masters" component={MastersScreen} />
          <Stack.Screen name="ResultPublish" component={ResultPublishScreen} />
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

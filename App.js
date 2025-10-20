import React from "react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Screens
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ShiftListScreen from "./screens/ShiftListScreen";
import ContractScreen from "./screens/ContractScreen";
import AdminScreen from "./screens/AdminScreen";
import EmployeeManagementScreen from "./screens/EmployeeManagementScreen";
import AdminShiftList from "./screens/AdminShiftList";
import AdminDashboardScreen from "./screens/AdminDashboardScreen";
import AdminCreateEventScreen from "./screens/AdminCreateEventScreen";
import AdminEventListScreen from "./screens/AdminEventListScreen";
import CameraTest from "./screens/Camera";
import ImageScreen from "./screens/Pictureview";
import MoreMenuScreen from "./screens/MoreMenuScreen";
import EmployeeMoreScreen from "./screens/EmployeeMoreScreen";


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

//Logout screen
function LogoutScreen() {
  const navigation = useNavigation();

  React.useEffect(() => {
    // Reset navigation så man ryger tilbage til Login
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  }, [navigation]);

  return <View />; // viser ikke noget
}

// Bottom tabs til medarbejdere
function EmployeeTabs({ route }) {
  const { userId, companyCode } = route.params;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Shifts') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Contract') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'EmployeeMore') {
            iconName = focused ? 'ellipsis-horizontal-circle' : 'ellipsis-horizontal-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Shifts"
        component={ShiftListScreen}
        options={{ title: "Vagtplan", headerShown: true }}
        initialParams={{ userId, companyCode }}
      />
      <Tab.Screen
        name="Contract"
        component={ContractScreen}
        options={{ title: "Kontrakt", headerShown: true }}
        initialParams={{ userId, companyCode }}
      />
      <Tab.Screen
        name="EmployeeMore"
        component={EmployeeMoreScreen}
        options={{ title: "Mere", headerShown: false }}
      />
    </Tab.Navigator>
  );
}

// Bottom tabs til admin
function AdminTabs({ route }) {
  const { companyCode } = route.params;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'AdminShiftList') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Admin') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'AdminCreateEvent') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'AdminEventList') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'MoreMenu') {
            iconName = focused ? 'ellipsis-horizontal-circle' : 'ellipsis-horizontal-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="AdminShiftList"
        component={AdminShiftList}
        options={{ title: "Vagtplan", headerShown: true }}
        initialParams={{ companyCode }}
      />
      <Tab.Screen
        name="Admin"
        component={AdminScreen}
        options={{ title: "Godkend", headerShown: true }}
        initialParams={{ companyCode }}
      />
      <Tab.Screen
        name="AdminCreateEvent"
        component={AdminCreateEventScreen}
        options={{ title: "Opret event", headerShown: true }}
        initialParams={{ companyCode }}
      />
      <Tab.Screen
        name="AdminEventList"
        component={AdminEventListScreen}
        options={{ title: "Events", headerShown: true }}
        initialParams={{ companyCode }}
      />
      <Tab.Screen
        name="MoreMenu"
        component={MoreMenuScreen}
        options={{ title: "Mere", headerShown: false }}
        initialParams={{ companyCode }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Opret bruger" }} />
        <Stack.Screen name="Camera" component={CameraTest} options={{ title: "Kamera" }} />
        <Stack.Screen name="Image" component={ImageScreen} options={{ title: "Billede" }} />
        <Stack.Screen name="AdminRegisterScreen" component={require("./screens/AdminRegisterScreen").default} options={{ title: "Opret virksomhed & admin" }} />
        <Stack.Screen name="EmployeeHome" component={EmployeeTabs} options={{ headerShown: false }} />
        <Stack.Screen name="AdminHome" component={AdminTabs} options={{ headerShown: false }} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: "Dashboard" }} />
        <Stack.Screen name="EmployeeManagement" component={EmployeeManagementScreen} options={{ title: "Overblik over medarbejdere" }} />
        <Stack.Screen name="EditEvent" component={AdminCreateEventScreen} options={{ title: "Rediger event" }} />
        <Stack.Screen name="Logout" component={LogoutScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import React from "react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { View } from "react-native";

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


const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

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

// Drawer til medarbejdere
function EmployeeDrawer({ route }) {
  const { userId, companyCode } = route.params;

  return (
    <Drawer.Navigator initialRouteName="Shifts" screenOptions={{ swipeEnabled: false }}>
      <Drawer.Screen
        name="Shifts"
        component={ShiftListScreen}
        options={{ title: "Vagtliste" }}
        initialParams={{ userId, companyCode }}
      />
      <Drawer.Screen
        name="Contract"
        component={ContractScreen}
        options={{ title: "Kontrakt" }}
        initialParams={{ userId, companyCode }}
      />
      <Drawer.Screen
        name="Logout"
        component={LogoutScreen}
        options={{ title: "Log ud" }}
      />
    </Drawer.Navigator>
  );
}

// Drawer til admin
function AdminDrawer({ route }) {
  const { companyCode } = route.params;

  return (
    <Drawer.Navigator initialRouteName="Admin" screenOptions={{ swipeEnabled: false }}>
      <Drawer.Screen
        name="Admin"
        component={AdminScreen}
        options={{ title: "Godkend medarbejdere" }}
        initialParams={{ companyCode }}
      />
      <Drawer.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: "Dashboard" }}
        initialParams={{ companyCode }}
      />
      <Drawer.Screen
        name="AdminCreateEvent"
        component={AdminCreateEventScreen}
        options={{ title: "Opret event" }}
        initialParams={{ companyCode }}
      />
      <Drawer.Screen
        name="AdminEventList"
        component={AdminEventListScreen}
        options={{ title: "Events" }}
        initialParams={{ companyCode }}
      />
      <Drawer.Screen
        name="AdminShiftList"
        component={AdminShiftList}
        options={{ title: "Vagtplan" }}
        initialParams={{ companyCode }}
      />
      <Drawer.Screen
        name="EmployeeManagement"
        component={EmployeeManagementScreen}
        options={{ title: "Overblik over medarbejdere" }}
        initialParams={{ companyCode }}
      />
      <Drawer.Screen
        name="Logout"
        component={LogoutScreen}
        options={{ title: "Log ud" }}
      />
    </Drawer.Navigator>
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
        <Stack.Screen name="EmployeeHome" component={EmployeeDrawer} options={{ headerShown: false }} />
        <Stack.Screen name="AdminHome" component={AdminDrawer} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

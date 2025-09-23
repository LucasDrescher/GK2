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
import EmployeeListScreen from "./screens/EmployeeListScreen";
import SignedContractsScreen from "./screens/SignedContractsScreen";

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
        name="EmployeeListScreen"
        component={EmployeeListScreen}
        options={{ title: "Alle medarbejdere" }}
        initialParams={{ companyCode }}
      />
      <Drawer.Screen
        name="SignedContracts"
        component={SignedContractsScreen}
        options={{ title: "Underskrevne kontrakter" }}
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
        <Stack.Screen name="EmployeeHome" component={EmployeeDrawer} options={{ headerShown: false }} />
        <Stack.Screen name="AdminHome" component={AdminDrawer} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

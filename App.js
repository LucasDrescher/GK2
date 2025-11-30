import React from "react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "./styles";

// Screens - Importeret fra organiserede mapper
import { LoginScreen, RegisterScreen } from "./screens/Auth";
import {
  AdminScreen,
  AdminRegisterScreen,
  AdminDashboardScreen,
  AdminCreateEventScreen,
  AdminEventListScreen,
  AdminEventPlanScreen,
  AdminShiftList,
  AdminProfileScreen,
  ApproveHoursScreen,
  EmployeeManagementScreen,
  EmployeeOverviewScreen,
} from "./screens/Admin";
import {
  ShiftListScreen,
  EmployeeMoreScreen,
  EmployeeProfileScreen,
  EmployeeHoursScreen,
} from "./screens/Employee";
import {
  CameraTest,
  ImageScreen,
  MoreMenuScreen,
  ContractScreen,
  InboxScreen,
  ChatRoomScreen,
  EventDetailScreen,
} from "./screens/Shared";

import { rtdb } from "./database/firebase";
import { ref as dbRef, onValue } from "firebase/database";


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
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!companyCode || !userId) return;

    const chatsRef = dbRef(rtdb, `companies/${companyCode}/chats`);
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val() || {};
      let totalUnread = 0;
      
      Object.values(data).forEach(chat => {
        // Kun tæl chats hvor brugeren er medlem
        if (chat.members && chat.members[userId]) {
          const userUnread = chat.unreadCount?.[userId] || 0;
          totalUnread += userUnread;
        }
      });
      
      setUnreadCount(totalUnread);
    });

    return () => unsubscribe();
  }, [companyCode, userId]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Overview') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Shifts') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'EmployeeInbox') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'EmployeeMore') {
            iconName = focused ? 'ellipsis-horizontal-circle' : 'ellipsis-horizontal-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
        },
      })}
    >
      <Tab.Screen
        name="Overview"
        component={EmployeeOverviewScreen}
        options={{ title: "Overblik", headerShown: false }}
        initialParams={{ userId, companyCode }}
      />
      <Tab.Screen
        name="Shifts"
        component={ShiftListScreen}
        options={{ title: "Vagtplan", headerShown: false }}
        initialParams={{ userId, companyCode }}
      />
      <Tab.Screen
        name="EmployeeInbox"
        component={InboxScreen}
        options={{ 
          title: "Indbakke", 
          headerShown: false,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
        initialParams={{ userId, companyCode, userRole: 'employee' }}
      />
      <Tab.Screen
        name="EmployeeMore"
        component={EmployeeMoreScreen}
        options={{ title: "Mere", headerShown: false }}
        initialParams={{ userId, companyCode }}
      />
    </Tab.Navigator>
  );
}

// Bottom tabs til admin
function AdminTabs({ route }) {
  const { companyCode, userId } = route.params || {};
  const [pendingCount, setPendingCount] = React.useState(0);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!companyCode) return;

    const employeesRef = dbRef(rtdb, `companies/${companyCode}/employees`);
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const pending = Object.values(data).filter(
          emp => emp.role === 'employee' && emp.approved === false
        ).length;
        setPendingCount(pending);
      } else {
        setPendingCount(0);
      }
    });

    return () => unsubscribe();
  }, [companyCode]);

  React.useEffect(() => {
    if (!companyCode || !userId) return;

    const chatsRef = dbRef(rtdb, `companies/${companyCode}/chats`);
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val() || {};
      let totalUnread = 0;
      
      Object.values(data).forEach(chat => {
        // Kun tæl chats hvor brugeren er medlem
        if (chat.members && chat.members[userId]) {
          const userUnread = chat.unreadCount?.[userId] || 0;
          totalUnread += userUnread;
        }
      });
      
      setUnreadCount(totalUnread);
    });

    return () => unsubscribe();
  }, [companyCode, userId]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'AdminShiftList') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'AdminCreateEvent') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'AdminEventList') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'AdminInbox') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'MoreMenu') {
            iconName = focused ? 'ellipsis-horizontal-circle' : 'ellipsis-horizontal-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
        },
      })}
    >
      <Tab.Screen
        name="AdminShiftList"
        component={AdminEventPlanScreen}
        options={{ title: "Kalender", headerShown: false }}
        initialParams={{ companyCode, userId }}
      />
      <Tab.Screen
        name="AdminEventList"
        component={AdminEventListScreen}
        options={{ title: "Events", headerShown: false }}
        initialParams={{ companyCode, userId }}
      />
      <Tab.Screen
        name="AdminCreateEvent"
        component={AdminCreateEventScreen}
        options={{ title: "Opret event", headerShown: false }}
        initialParams={{ companyCode, userId }}
      />
      <Tab.Screen
        name="AdminInbox"
        component={InboxScreen}
        options={{ 
          title: "Indbakke", 
          headerShown: false,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
        initialParams={{ companyCode, userId, userRole: 'admin' }}
      />
      <Tab.Screen
        name="MoreMenu"
        component={MoreMenuScreen}
        options={{ 
          title: "Mere", 
          headerShown: false,
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
        }}
        initialParams={{ companyCode, userId }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: "Opret Bruger" }}
          />
          <Stack.Screen
            name="AdminRegisterScreen"
            component={AdminRegisterScreen}
            options={{ title: "Opret Virksomhed & Admin" }}
          />
          <Stack.Screen
            name="AdminHome"
            component={AdminTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EmployeeHome"
            component={EmployeeTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Contract"
            component={ContractScreen}
            options={{ title: "Kontrakt" }}
          />
          <Stack.Screen
            name="EditEvent"
            component={AdminCreateEventScreen}
            options={{ title: "Rediger Event" }}
          />
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboardScreen}
            options={{ title: "Dashboard" }}
          />
          <Stack.Screen
            name="AdminProfile"
            component={AdminProfileScreen}
            options={{ title: "Profil" }}
          />
          <Stack.Screen
            name="EmployeeProfile"
            component={EmployeeProfileScreen}
            options={{ title: "Profil" }}
          />
          <Stack.Screen
            name="ChatRoom"
            component={ChatRoomScreen}
            options={{ title: "Chat" }}
          />
          <Stack.Screen
            name="EventDetail"
            component={EventDetailScreen}
            options={{ title: "Event Detaljer" }}
          />
          <Stack.Screen
            name="EmployeeHours"
            component={EmployeeHoursScreen}
            options={{ title: "Dine Timer" }}
          />
          <Stack.Screen
            name="ApproveHours"
            component={ApproveHoursScreen}
            options={{ title: "Godkend Timer" }}
          />
          <Stack.Screen
            name="EmployeeManagement"
            component={EmployeeManagementScreen}
            options={{ title: "Medarbejdere" }}
          />
          <Stack.Screen
            name="Logout"
            component={LogoutScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Camera"
            component={CameraTest}
            options={{ title: "Tag billede", headerShown: false }}
          />
          <Stack.Screen
            name="Image"
            component={ImageScreen}
            options={{ title: "Billede" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

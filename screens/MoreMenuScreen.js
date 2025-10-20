import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../styles';

export default function MoreMenuScreen({ navigation, route }) {
  const { companyCode } = route.params || {};

  const menuItems = [
    {
      title: 'Dashboard',
      icon: 'stats-chart-outline',
      onPress: () => navigation.navigate('AdminDashboard', { companyCode }),
    },
    {
      title: 'Overblik over medarbejdere',
      icon: 'people-outline',
      onPress: () => navigation.navigate('EmployeeManagement', { companyCode }),
    },
    {
      title: 'Log ud',
      icon: 'log-out-outline',
      onPress: () => navigation.navigate('Logout'),
    },
  ];

  return (
    <ScrollView style={globalStyles.moreMenuContainer}>
      <View style={globalStyles.moreMenuHeader}>
        <Text style={globalStyles.moreMenuHeaderText}>Mere</Text>
      </View>
      
      <View style={globalStyles.moreMenuItemsContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={globalStyles.moreMenuItem}
            onPress={item.onPress}
          >
            <View style={globalStyles.moreMenuItemLeft}>
              <Ionicons name={item.icon} size={24} color="#333" style={globalStyles.moreMenuIcon} />
              <Text style={globalStyles.moreMenuItemText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color="#999" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

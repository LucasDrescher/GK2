import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../../styles';
import { rtdb } from '../../database/firebase';
import { ref, onValue } from 'firebase/database';

export default function MoreMenuScreen({ navigation, route }) {
  const { companyCode } = route.params || {};
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingHoursCount, setPendingHoursCount] = useState(0);

  useEffect(() => {
    if (!companyCode) return;

    const employeesRef = ref(rtdb, `companies/${companyCode}/employees`);
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

    // Lyt til events for at tælle afventende timegodkendelser
    const eventsRef = ref(rtdb, `companies/${companyCode}/events`);
    const unsubscribeEvents = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      let count = 0;
      Object.values(data).forEach(event => {
        if (event.assignedEmployees) {
          Object.values(event.assignedEmployees).forEach(emp => {
            if (!emp.hoursApproved && !emp.hoursRejected) {
              count++;
            }
          });
        }
      });
      setPendingHoursCount(count);
    });

    return () => {
      unsubscribe();
      unsubscribeEvents();
    };
  }, [companyCode]);

  const menuItems = [
    {
      title: 'Dashboard',
      icon: 'stats-chart-outline',
      onPress: () => navigation.navigate('AdminDashboard', { companyCode }),
      badge: null,
    },
    {
      title: 'Godkend timer',
      icon: 'time-outline',
      onPress: () => navigation.navigate('ApproveHours', { companyCode }),
      badge: pendingHoursCount > 0 ? pendingHoursCount : null,
    },
    {
      title: 'Profil',
      icon: 'person-outline',
      onPress: () => navigation.navigate('AdminProfile', { companyCode }),
      badge: null,
    },
    {
      title: 'Overblik over medarbejdere',
      icon: 'people-outline',
      onPress: () => navigation.navigate('EmployeeManagement', { companyCode }),
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      title: 'Log ud',
      icon: 'log-out-outline',
      onPress: () => navigation.navigate('Logout'),
      badge: null,
    },
  ];

  return (
    <SafeAreaView style={globalStyles.safeArea}>
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
                <Ionicons name={item.icon} size={24} color={colors.primary} style={globalStyles.moreMenuIcon} />
                <Text style={globalStyles.moreMenuItemText}>{item.title}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {item.badge && (
                  <View style={{
                    backgroundColor: colors.error,
                    borderRadius: 12,
                    minWidth: 24,
                    height: 24,
                    paddingHorizontal: 6,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700' }}>
                      {item.badge}
                    </Text>
                  </View>
                )}
                <Ionicons name="chevron-forward-outline" size={24} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

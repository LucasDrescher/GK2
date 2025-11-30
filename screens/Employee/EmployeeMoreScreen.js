import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../../styles';

export default function EmployeeMoreScreen({ navigation, route }) {
  const { userId, companyCode } = route.params || {};

  const menuItems = [
    {
      title: 'Profil',
      icon: 'person-outline',
      onPress: () => navigation.navigate('EmployeeProfile', { userId, companyCode }),
    },
    {
      title: 'Kontrakt',
      icon: 'document-text-outline',
      onPress: () => navigation.navigate('Contract', { userId, companyCode }),
    },
    {
      title: 'Dine timer',
      icon: 'time-outline',
      onPress: () => navigation.navigate('EmployeeHours', { userId, companyCode }),
    },
    {
      title: 'Tilgængelighed',
      icon: 'calendar-clear-outline',
      onPress: () => {
        // TODO: Navigation til tilgængelighed
        console.log('Tilgængelighed');
      },
    },
    {
      title: 'Fremmøde',
      icon: 'checkmark-done-outline',
      onPress: () => {
        // TODO: Navigation til fremmøde
        console.log('Fremmøde');
      },
    },
    {
      title: 'Log ud',
      icon: 'log-out-outline',
      onPress: () => navigation.navigate('Logout'),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 60,
          paddingBottom: 32,
          paddingHorizontal: 16,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <Text style={{ 
          fontSize: 32, 
          fontWeight: '800', 
          color: colors.white,
        }}>
          Mere
        </Text>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 16 }}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: colors.black,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
              }}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.primary + '15',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name={item.icon} size={24} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                  {item.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

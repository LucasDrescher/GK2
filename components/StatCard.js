// Genbrugelig StatCard komponent til dashboard
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles';

export default function StatCard({ 
  value, 
  label, 
  icon,
  gradientColors = [colors.primary, colors.primaryDark],
  style 
}) {
  return (
    <View style={[{
      width: '48%',
      marginBottom: 12,
    }, style]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          padding: 18,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {icon && (
          <View style={{ marginBottom: 8 }}>
            {icon}
          </View>
        )}
        <Text style={{ 
          fontSize: 32, 
          fontWeight: '800', 
          color: colors.white,
          marginBottom: 4,
        }}>
          {value}
        </Text>
        <Text style={{ 
          fontSize: 13, 
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: '500',
        }}>
          {label}
        </Text>
      </LinearGradient>
    </View>
  );
}

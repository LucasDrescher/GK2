import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles';

export const StatusBadge = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'upcoming':
        return {
          label: 'Kommende',
          backgroundColor: colors.info + '20',
          color: colors.info,
        };
      case 'ongoing':
        return {
          label: 'I gang',
          backgroundColor: colors.success + '20',
          color: colors.success,
        };
      case 'completed':
        return {
          label: 'Afsluttet',
          backgroundColor: colors.gray300,
          color: colors.gray600,
        };
      default:
        return {
          label: 'Ukendt',
          backgroundColor: colors.gray200,
          color: colors.gray500,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

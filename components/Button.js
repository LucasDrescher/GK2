// Genbrugelig Button komponent
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { globalStyles, colors } from '../styles';

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary',
  loading = false,
  disabled = false,
  icon = null,
  style,
  textStyle 
}) {
  const isPrimary = variant === 'primary';
  
  return (
    <TouchableOpacity
      style={[
        isPrimary ? globalStyles.primaryButton : globalStyles.secondaryButton,
        (disabled || loading) && { opacity: 0.6 },
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.primary} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={[
            isPrimary ? globalStyles.primaryButtonText : globalStyles.secondaryButtonText,
            textStyle
          ]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

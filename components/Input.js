// Genbrugelig Input komponent
import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { globalStyles, colors } from '../styles';

export default function Input({ 
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  ...props
}) {
  return (
    <View>
      {label && <Text style={globalStyles.inputLabel}>{label}</Text>}
      <TextInput
        style={[globalStyles.input, multiline && { minHeight: 100, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        {...props}
      />
    </View>
  );
}

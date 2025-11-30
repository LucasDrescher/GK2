import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import SignatureScreen from 'react-native-signature-canvas';
import { colors } from '../styles';

export default function SignatureCanvas({ onSave, onClear }) {
  const signatureRef = useRef(null);

  const handleSignature = (signature) => {
    // Signature er en base64 string
    if (onSave) {
      onSave(signature);
    }
  };

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
    if (onClear) {
      onClear();
    }
  };

  const handleEnd = () => {
    if (signatureRef.current) {
      signatureRef.current.readSignature();
    }
  };

  const style = `.m-signature-pad--footer {display: none; margin: 0px;}`;

  return (
    <View style={styles.container}>
      <SignatureScreen
        ref={signatureRef}
        onEnd={handleEnd}
        onOK={handleSignature}
        onClear={handleClear}
        descriptionText=""
        clearText="Ryd"
        confirmText="Gem"
        webStyle={style}
        autoClear={false}
        backgroundColor={colors.surface}
        penColor={colors.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
});

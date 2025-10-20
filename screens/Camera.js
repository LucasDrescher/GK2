import React, { useState, useRef } from 'react';
import { Text, TouchableOpacity, View, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { globalStyles } from '../styles';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function CameraTest({ navigation, route }) {
  const { targetField } = route?.params || {}; // fx "passportUri", "criminalRecordUri", "workPermitUri"

  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [imagesArr, setImagesArr] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gallery, setGallery] = useState(false);
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef(null);

  function toggleFacing() {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }

  async function snap() {
    if (!cameraRef.current) return;
    try {
      setLoading(true);
      const result = await cameraRef.current.takePictureAsync();
      setImagesArr((prev) => [...prev, result]);

      // send seneste billede tilbage til Register via params
      if (targetField) {
        // prefer explicit passportUri for compatibility, otherwise use the dynamic field
        const params = targetField === 'passportUri' ? { passportUri: result.uri } : { [targetField]: result.uri };
        navigation.navigate('Register', params);
      }
    } catch (err) {
      console.log('Snap error:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleGallery() {
    setGallery((prev) => !prev);
  }

  function zoomIn() { setZoom((prev) => (prev + 0.1 <= 1 ? prev + 0.1 : 1)); }
  function zoomOut() { setZoom((prev) => (prev - 0.1 >= 0 ? prev - 0.1 : 0)); }

  const CameraGallery = () => (
    <View style={globalStyles.smallPadding}>
      <Text style={globalStyles.itemText}>Billeder taget: {imagesArr.length}</Text>
      <ScrollView horizontal>
        {imagesArr.length > 0 ? (
          imagesArr.map((image, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate('Image', { image: image.uri })}
            >
              <Image source={{ uri: image.uri }} style={{ width: 80, height: 80, margin: 5 }} />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={globalStyles.itemText}>No images taken</Text>
        )}
      </ScrollView>
    </View>
  );

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={globalStyles.centerAligned}>
        <Text style={globalStyles.permissionText}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={globalStyles.blueLink}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[globalStyles.container, { padding: 0 }]}> 
      <View style={globalStyles.cameraWrapper}>
        <CameraView
          ref={cameraRef}
          style={globalStyles.cameraView}
          facing={facing}
          zoom={zoom}
        />

        {/* Overlay controls (absolutely positioned so CameraView has no children) */}
        <View style={globalStyles.overlayAbsolute} pointerEvents="box-none">
          {/* Top row - gallery toggle */}
          <View style={globalStyles.topRightPadding16} pointerEvents="auto">
            <TouchableOpacity onPress={toggleGallery} style={globalStyles.smallPadding}>
              <Ionicons name="images-outline" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Bottom controls */}
          <View style={globalStyles.controlRow} pointerEvents="auto">
            <TouchableOpacity onPress={toggleFacing} style={globalStyles.smallPadding}>
              <Ionicons name="camera-reverse-outline" size={34} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={snap} style={globalStyles.snapButtonOuter}>
              <View style={globalStyles.snapButtonInner} />
            </TouchableOpacity>

            <View style={globalStyles.zoomControls}>
              <TouchableOpacity onPress={zoomIn} style={globalStyles.smallPadding}>
                <Ionicons name="add-outline" size={30} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={zoomOut} style={globalStyles.smallPadding}>
                <Ionicons name="remove-outline" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {gallery ? <CameraGallery /> : null}
      </View>
    </SafeAreaView>
  );
}

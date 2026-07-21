import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CheckToggleCircle = ({ isCompleted, onToggle, size = 24 }) => {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={styles.container}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: isCompleted ? '#4CAF50' : '#6B7280',
            backgroundColor: isCompleted ? '#4CAF50' : 'transparent',
          },
        ]}
      >
        {isCompleted && (
          <Ionicons name="checkmark" size={size * 0.6} color="#FFFFFF" />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CheckToggleCircle;
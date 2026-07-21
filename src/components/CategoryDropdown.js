import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  'Business',
  'Personal',
  'Education',
  'Credit Card Bill',
  'Other',
  'Insurance',
  'Land Tax',
  'Utility',
  'Subscription',
  'Loan',
];

const CategoryDropdown = ({ selectedValue, onSelect, label = 'Category' }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (category) => {
    onSelect(category);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectorText, !selectedValue && styles.placeholderText]}>
          {selectedValue || `Select ${label}`}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select {label}</Text>
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedValue === item && styles.selectedOption,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedValue === item && styles.selectedOptionText,
                    ]}
                  >
                    {item}
                  </Text>
                  {selectedValue === item && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A2332',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2D3A4A',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectorText: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  placeholderText: {
    color: '#6B7280',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: '#1A2332',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#2D3A4A',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3A4A',
  },
  selectedOption: {
    backgroundColor: '#243044',
  },
  optionText: {
    fontSize: 15,
    color: '#D1D5DB',
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default CategoryDropdown;
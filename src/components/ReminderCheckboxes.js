import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const REMINDER_OPTIONS = [
  { value: 3, label: 'Remind 3 days before' },
  { value: 1, label: 'Remind 1 day before' },
];

const ReminderCheckboxes = ({ selectedValues, onSelectionChange }) => {
  const toggleReminder = (value) => {
    const currentValues = Array.isArray(selectedValues) ? selectedValues : [];
    if (currentValues.includes(value)) {
      onSelectionChange(currentValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...currentValues, value]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>REMINDERS</Text>
      {REMINDER_OPTIONS.map((option) => {
        const isSelected = selectedValues?.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            style={styles.checkboxRow}
            onPress={() => toggleReminder(option.value)}
          >
            <View
              style={[
                styles.checkbox,
                isSelected && styles.checkboxSelected,
              ]}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
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
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#D1D5DB',
  },
});

export default ReminderCheckboxes;
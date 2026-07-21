import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import CheckToggleCircle from './CheckToggleCircle';

const DueRow = ({ due, onPress, onToggle }) => {
  const dueDate = due.dueDate instanceof Date ? due.dueDate : new Date(due.dueDate);
  const day = dueDate.getDate();
  const month = dueDate.toLocaleString('default', { month: 'short' }).toUpperCase();
  const formattedAmount = `₹${Number(due.amount).toLocaleString('en-IN')}`;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Date on left */}
      <View style={styles.dateContainer}>
        <Text style={[styles.dayText, due.isCompleted && styles.completedText]}>
          {day}
        </Text>
        <Text style={[styles.monthText, due.isCompleted && styles.completedText]}>
          {month}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Title and amount in middle */}
      <View style={styles.contentContainer}>
        <Text
          style={[
            styles.titleText,
            due.isCompleted && styles.completedTitleText,
          ]}
          numberOfLines={1}
        >
          {due.title}
        </Text>
        <Text
          style={[
            styles.amountText,
            due.isCompleted && styles.completedText,
          ]}
        >
          {formattedAmount}
        </Text>
      </View>

      {/* Check toggle circle on right */}
      <CheckToggleCircle
        isCompleted={due.isCompleted}
        onToggle={onToggle}
        size={24}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2332',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 5,
  },
  dateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  dayText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  monthText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#2D3A4A',
    marginHorizontal: 12,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 12,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  completedTitleText: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
  },
  completedText: {
    color: '#6B7280',
  },
});

export default DueRow;
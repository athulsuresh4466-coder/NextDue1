import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDueById, deleteDue, toggleDueStatus, addDue } from '../services/firestoreService';
import { scheduleReminders, cancelReminders } from '../services/notificationService';
import { deleteReceipt } from '../services/storageService';

const DetailScreen = ({ route, navigation }) => {
  const { dueId } = route.params;
  const [due, setDue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadDue();
  }, [dueId]);

  useEffect(() => {
    if (due) {
      navigation.setOptions({
        headerRight: () => (
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddEditDue', { dueId: due.id })}
              style={styles.headerButton}
            >
              <Ionicons name="pencil-outline" size={22} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [due, navigation]);

  const loadDue = async () => {
    try {
      const data = await getDueById(dueId);
      setDue(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load due details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete this due?',
      "This can't be undone",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Cancel notifications first
              if (due.notificationIds?.length > 0) {
                await cancelReminders({ notificationIds: due.notificationIds });
              }
              // Delete receipt if exists
              if (due.receiptUrl) {
                await deleteReceipt(due.receiptUrl);
              }
              // Delete from Firestore
              await deleteDue(dueId);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete due');
            }
          },
        },
      ]
    );
  };

  const handleToggleComplete = async () => {
    setToggling(true);
    try {
      const result = await toggleDueStatus(due.id, due.isCompleted);

      if (!due.isCompleted) {
        // Marking complete
        await cancelReminders({ ...due, notificationIds: due.notificationIds || [] });

        // Auto-create next occurrence for recurring dues
        if (due.recurrence === 'monthly' || due.recurrence === 'yearly') {
          const nextDate = new Date(due.dueDate);
          if (due.recurrence === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1);
          } else {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
          }

          const newDueData = {
            title: due.title,
            description: due.description,
            company: due.company,
            amount: due.amount,
            currency: due.currency,
            category: due.category,
            recurrence: due.recurrence,
            priority: due.priority,
            notes: due.notes,
            dueDate: nextDate,
            reminders: due.reminders,
          };

          const newDue = await addDue(newDueData);

          // Schedule reminders for the new due
          if (due.reminders?.length > 0) {
            await scheduleReminders({ ...newDueData, id: newDue.id });
          }
        }
      } else {
        // Un-marking complete → reschedule reminders
        if (due.reminders?.length > 0) {
          await scheduleReminders({ ...due, id: due.id });
        }
      }

      await loadDue();
    } catch (err) {
      Alert.alert('Error', 'Failed to update due status');
    } finally {
      setToggling(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#4CAF50';
      case 'overdue': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!due) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Due not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Status Badge */}
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(due.status) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(due.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(due.status) }]}>
            {due.status?.toUpperCase() || 'PENDING'}
          </Text>
        </View>
        {due.priority && (
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>
              {due.priority.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title}>{due.title}</Text>

      {/* Amount */}
      <Text style={styles.amount}>{formatAmount(due.amount)}</Text>

      {/* Details Card */}
      <View style={styles.card}>
        <DetailRow icon="calendar-outline" label="Due Date" value={formatDate(due.dueDate)} />
        <DetailRow icon="pricetag-outline" label="Category" value={due.category || 'N/A'} />
        <DetailRow icon="business-outline" label="Company" value={due.company || 'N/A'} />
        <DetailRow icon="repeat-outline" label="Recurrence" value={due.recurrence || 'One-time'} />
        <DetailRow icon="flag-outline" label="Priority" value={due.priority || 'Medium'} />
        {due.completedDate && (
          <DetailRow icon="checkmark-circle-outline" label="Completed On" value={formatDate(due.completedDate)} />
        )}
      </View>

      {/* Description */}
      {due.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DESCRIPTION</Text>
          <Text style={styles.sectionContent}>{due.description}</Text>
        </View>
      ) : null}

      {/* Notes */}
      {due.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTES</Text>
          <Text style={styles.sectionContent}>{due.notes}</Text>
        </View>
      ) : null}

      {/* Reminders */}
      {due.reminders?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REMINDERS</Text>
          {due.reminders.map((days, index) => (
            <Text key={index} style={styles.sectionContent}>
              {days} day{days > 1 ? 's' : ''} before
            </Text>
          ))}
        </View>
      )}

      {/* Receipt */}
      {due.receiptUrl && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECEIPT</Text>
          <TouchableOpacity
            style={styles.receiptLink}
            onPress={() => Linking.openURL(due.receiptUrl)}
          >
            <Ionicons name="document-outline" size={18} color="#4CAF50" />
            <Text style={styles.receiptLinkText}>View Receipt</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mark as Complete / Completed Button */}
      <TouchableOpacity
        style={[
          styles.completeButton,
          due.isCompleted && styles.completedButton,
          toggling && styles.buttonDisabled,
        ]}
        onPress={handleToggleComplete}
        disabled={toggling}
      >
        {toggling ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons
              name={due.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color="#FFFFFF"
              style={styles.completeIcon}
            />
            <Text style={styles.completeButtonText}>
              {due.isCompleted ? 'Completed' : 'Mark as completed'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLabelContainer}>
      <Ionicons name={icon} size={16} color="#6B7280" />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1621',
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f1621',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priorityBadge: {
    backgroundColor: '#2D3A4A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#4CAF50',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1A2332',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3A4A',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'right',
    maxWidth: '50%',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 22,
  },
  receiptLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptLinkText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 6,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  completedButton: {
    backgroundColor: '#2D3A4A',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  completeIcon: {
    marginRight: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
});

export default DetailScreen;
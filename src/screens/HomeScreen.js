import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DueRow from '../components/DueRow';
import { useDues } from '../hooks/useDues';
import { toggleDueStatus } from '../services/firestoreService';
import { scheduleReminders, cancelReminders } from '../services/notificationService';

const HomeScreen = ({ navigation }) => {
  const { dues, loading, refreshing, error, refresh } = useDues();

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleToggle = async (due) => {
    try {
      const result = await toggleDueStatus(due.id, due.isCompleted);
      
      if (!due.isCompleted) {
        // Marking complete → cancel reminders
        await cancelReminders({ ...due, notificationIds: due.notificationIds || [] });
      } else {
        // Un-marking complete → reschedule reminders
        if (due.reminders && due.reminders.length > 0) {
          await scheduleReminders({ ...due, id: due.id });
        }
      }
      
      refresh();
    } catch (err) {
      Alert.alert('Error', 'Failed to update due status');
    }
  };

  const handleRowPress = (due) => {
    navigation.navigate('Detail', { dueId: due.id });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color="#2D3A4A" />
      <Text style={styles.emptyTitle}>No dues yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap the + button to add your first due
      </Text>
    </View>
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <Ionicons
            name="settings-outline"
            size={22}
            color="#9CA3AF"
            style={styles.headerIcon}
            onPress={() => navigation.navigate('Profile')}
          />
          <Ionicons
            name="add-circle"
            size={32}
            color="#4CAF50"
            onPress={() => navigation.navigate('AddEditDue', {})}
          />
        </View>
      ),
    });
  }, [navigation]);

  if (loading && dues.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={dues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DueRow
            due={item}
            onPress={() => handleRowPress(item)}
            onToggle={() => handleToggle(item)}
          />
        )}
        ListHeaderComponent={error ? <Text style={styles.errorBanner}>{error}</Text> : null}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={dues.length === 0 ? styles.emptyListContainer : styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#4CAF50"
            colors={['#4CAF50']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1621',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f1621',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingVertical: 8,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 16,
  },
  errorBanner: {
    color: '#FCA5A5',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 10,
    fontSize: 13,
  },
});

export default HomeScreen;
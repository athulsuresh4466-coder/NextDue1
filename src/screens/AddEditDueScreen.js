import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import CategoryDropdown from '../components/CategoryDropdown';
import ReminderCheckboxes from '../components/ReminderCheckboxes';
import { addDue, updateDue, getDueById } from '../services/firestoreService';
import { scheduleReminders, cancelReminders } from '../services/notificationService';
import { uploadReceipt } from '../services/storageService';

const RECURRENCE_OPTIONS = ['one-time', 'monthly', 'yearly'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

const toDateInputValue = (date) => {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromDateInputValue = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const isSameDay = (dateA, dateB) =>
  dateA.getFullYear() === dateB.getFullYear() &&
  dateA.getMonth() === dateB.getMonth() &&
  dateA.getDate() === dateB.getDate();

const getCalendarDays = (visibleMonth) => {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
};

const AddEditDueScreen = ({ route, navigation }) => {
  const { dueId } = route.params || {};
  const isEditing = !!dueId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [company, setCompany] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [dueDateText, setDueDateText] = useState(toDateInputValue(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [category, setCategory] = useState('');
  const [recurrence, setRecurrence] = useState('one-time');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');
  const [reminders, setReminders] = useState([]);
  const [receiptUri, setReceiptUri] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      loadDue();
    }
  }, [dueId]);

  const loadDue = async () => {
    try {
      const due = await getDueById(dueId);
      setTitle(due.title || '');
      setDescription(due.description || '');
      setCompany(due.company || '');
      setAmount(String(due.amount || ''));
      const loadedDueDate = due.dueDate instanceof Date ? due.dueDate : new Date(due.dueDate);
      setDueDate(loadedDueDate);
      setDueDateText(toDateInputValue(loadedDueDate));
      setCalendarMonth(new Date(loadedDueDate.getFullYear(), loadedDueDate.getMonth(), 1));
      setCategory(due.category || '');
      setRecurrence(due.recurrence || 'one-time');
      setPriority(due.priority || 'medium');
      setNotes(due.notes || '');
      setReminders(due.reminders || []);
      setReceiptUrl(due.receiptUrl || '');
    } catch (err) {
      Alert.alert('Error', 'Failed to load due details');
      navigation.goBack();
    } finally {
      setFetching(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateText) || Number.isNaN(fromDateInputValue(dueDateText).getTime())) {
      newErrors.dueDate = 'Use YYYY-MM-DD format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let uploadedReceiptUrl = receiptUrl;

      // Upload receipt if a new one was selected
      if (receiptUri) {
        try {
          uploadedReceiptUrl = await uploadReceipt(receiptUri, dueId || 'temp');
        } catch (e) {
          console.log('Receipt upload failed:', e);
        }
      }

      const dueData = {
        title: title.trim(),
        description: description.trim(),
        company: company.trim(),
        amount: Number(amount),
        currency: 'INR',
        category,
        recurrence,
        priority,
        notes: notes.trim(),
        dueDate: fromDateInputValue(dueDateText),
        reminders,
        receiptUrl: uploadedReceiptUrl,
      };

      if (isEditing) {
        // Cancel old reminders first
        const oldDue = await getDueById(dueId);
        if (oldDue.notificationIds?.length > 0) {
          await cancelReminders({ notificationIds: oldDue.notificationIds });
        }

        await updateDue(dueId, dueData);

        // Schedule new reminders
        if (reminders.length > 0) {
          await scheduleReminders({ ...dueData, id: dueId });
        }
      } else {
        const newDue = await addDue(dueData);

        // Schedule reminders
        if (reminders.length > 0) {
          await scheduleReminders({ ...dueData, id: newDue.id });
        }
      }

      navigation.goBack();
    } catch (err) {
      console.error('Failed to save due:', err);
      Alert.alert('Error', err.message || 'Failed to save due. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
      setDueDateText(toDateInputValue(selectedDate));
      setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  };

  const handleCalendarDateSelect = (date) => {
    setDueDate(date);
    setDueDateText(toDateInputValue(date));
    setErrors((currentErrors) => ({ ...currentErrors, dueDate: undefined }));
  };

  const changeCalendarMonth = (offset) => {
    setCalendarMonth((currentMonth) => (
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1)
    ));
  };

  const handleReceiptPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setReceiptUri(result.assets[0].uri);
      }
    } catch (err) {
      // User cancelled
    }
  };

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Title */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>TITLE *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          placeholder="e.g. Car Insurance Premium"
          placeholderTextColor="#6B7280"
          value={title}
          onChangeText={setTitle}
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>

      {/* Description */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>DESCRIPTION</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Optional description"
          placeholderTextColor="#6B7280"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Company/Person */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>PERSON / COMPANY</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. LIC, KSEB"
          placeholderTextColor="#6B7280"
          value={company}
          onChangeText={setCompany}
        />
      </View>

      {/* Amount */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>AMOUNT *</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={[styles.input, styles.amountInput, errors.amount && styles.inputError]}
            placeholder="0"
            placeholderTextColor="#6B7280"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>
        {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
      </View>

      {/* Due Date */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>DUE DATE</Text>
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
          <Text style={styles.dateText}>{formatDate(dueDate)}</Text>
        </TouchableOpacity>
        {Platform.OS === 'web' ? (
          <View style={[styles.calendarContainer, errors.dueDate && styles.inputError]}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() => changeCalendarMonth(-1)}
              >
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <Text style={styles.calendarMonthText}>
                {calendarMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>

              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() => changeCalendarMonth(1)}
              >
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysRow}>
              {WEEK_DAYS.map((day) => (
                <Text key={day} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {getCalendarDays(calendarMonth).map((date, index) => {
                const selected = date && isSameDay(date, dueDate);
                const today = date && isSameDay(date, new Date());

                return (
                  <TouchableOpacity
                    key={date ? toDateInputValue(date) : `blank-${index}`}
                    style={[
                      styles.calendarDay,
                      !date && styles.calendarDayBlank,
                      today && styles.calendarDayToday,
                      selected && styles.calendarDaySelected,
                    ]}
                    disabled={!date}
                    onPress={() => date && handleCalendarDateSelect(date)}
                  >
                    {date && (
                      <Text
                        style={[
                          styles.calendarDayText,
                          today && styles.calendarDayTodayText,
                          selected && styles.calendarDaySelectedText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.selectedDateHint}>Selected: {formatDate(dueDate)}</Text>
            {errors.dueDate && <Text style={styles.errorText}>{errors.dueDate}</Text>}
          </View>
        ) : showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date(2020, 0, 1)}
            themeVariant="dark"
          />
        )}
      </View>

      {/* Category */}
      <CategoryDropdown
        label="CATEGORY"
        selectedValue={category}
        onSelect={setCategory}
      />

      {/* Recurrence */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>RECURRENCE</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowRecurrencePicker(!showRecurrencePicker)}
        >
          <Text style={styles.selectorText}>{recurrence}</Text>
          <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        {showRecurrencePicker && (
          <View style={styles.inlinePicker}>
            {RECURRENCE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.inlineOption,
                  recurrence === opt && styles.inlineOptionSelected,
                ]}
                onPress={() => {
                  setRecurrence(opt);
                  setShowRecurrencePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.inlineOptionText,
                    recurrence === opt && styles.inlineOptionTextSelected,
                  ]}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1).replace('-', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Priority */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>PRIORITY</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowPriorityPicker(!showPriorityPicker)}
        >
          <Text style={styles.selectorText}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</Text>
          <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        {showPriorityPicker && (
          <View style={styles.inlinePicker}>
            {PRIORITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.inlineOption,
                  priority === opt && styles.inlineOptionSelected,
                ]}
                onPress={() => {
                  setPriority(opt);
                  setShowPriorityPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.inlineOptionText,
                    priority === opt && styles.inlineOptionTextSelected,
                  ]}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Reminders */}
      <ReminderCheckboxes
        selectedValues={reminders}
        onSelectionChange={setReminders}
      />

      {/* Receipt Attachment */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>RECEIPT</Text>
        <TouchableOpacity style={styles.receiptButton} onPress={handleReceiptPick}>
          <Ionicons name="attach-outline" size={18} color="#4CAF50" />
          <Text style={styles.receiptButtonText}>
            {receiptUri ? 'Change receipt' : receiptUrl ? 'View attached receipt' : 'Attach receipt'}
          </Text>
        </TouchableOpacity>
        {receiptUri && (
          <Text style={styles.receiptInfo} numberOfLines={1}>
            New receipt selected
          </Text>
        )}
        {receiptUrl && !receiptUri && (
          <Text style={styles.receiptInfo} numberOfLines={1}>
            Receipt attached
          </Text>
        )}
      </View>

      {/* Notes */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>NOTES</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any additional notes..."
          placeholderTextColor="#6B7280"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Update Due' : 'Save Due'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

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
  fieldContainer: {
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
  input: {
    backgroundColor: '#1A2332',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2D3A4A',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D1D5DB',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2332',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2D3A4A',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 15,
    color: '#FFFFFF',
    marginLeft: 10,
  },
  webDateInput: {
    marginTop: 8,
  },
  calendarContainer: {
    backgroundColor: '#1A2332',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2D3A4A',
    marginTop: 10,
    padding: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#243044',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    width: `${100 / 7}%`,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  calendarDayBlank: {
    opacity: 0,
  },
  calendarDayToday: {
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  calendarDaySelected: {
    backgroundColor: '#4CAF50',
  },
  calendarDayText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarDayTodayText: {
    color: '#FFFFFF',
  },
  calendarDaySelectedText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  selectedDateHint: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
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
  inlinePicker: {
    backgroundColor: '#1A2332',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2D3A4A',
    marginTop: 4,
    overflow: 'hidden',
  },
  inlineOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3A4A',
  },
  inlineOptionSelected: {
    backgroundColor: '#243044',
  },
  inlineOptionText: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  inlineOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  receiptButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 6,
  },
  receiptInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AddEditDueScreen;
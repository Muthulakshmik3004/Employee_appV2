import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Circle } from 'react-native-svg';
import { timesheetService } from './services/timesheetService';

const { width } = Dimensions.get('window');

const DailyTimesheet = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [employeeName] = useState('Muthulakshmi');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);

  const [timeSlots, setTimeSlots] = useState([
    { time: '09-10 AM', activity: 'working', label: 'Working' },
    { time: '10-11 AM', activity: 'working', label: 'Working' },
    { time: '11-12 AM', activity: 'working', label: 'Working' },
    { time: '12-01 PM', activity: 'working', label: 'Working' },
    { time: '01-02 PM', activity: 'working', label: 'Working' },
    { time: '02-03 PM', activity: null, label: 'Break' },
    { time: '03-04 PM', activity: 'working', label: 'Working' },
    { time: '04-05 PM', activity: 'meeting', label: 'Meeting' },
    { time: '05-06 PM', activity: 'learning', label: 'Learning' },
    { time: '06-07 PM', activity: 'learning', label: 'Learning' },
  ]);

  const [activities, setActivities] = useState([
    { id: 1, time: '04-05 PM', type: 'meeting', meetingType: 'Client', participants: 'John, Jane, Manager', title: '', notes: '' },
    { id: 2, time: '05-06 PM', type: 'learning', title: 'Training Session', notes: 'React best practices', project: '', task: '', meetingType: '', participants: '' },
  ]);

  const activityTypes = [
    { value: 'working', label: 'Working', color: '#3B82F6' },
    { value: 'meeting', label: 'Meeting', color: '#A855F7' },
    { value: 'learning', label: 'Learning', color: '#22C55E' },
  ];

  // Load timesheet data when date changes
  useEffect(() => {
    const loadTimesheetData = async () => {
      try {
        // Use hardcoded employee ID "02" that matches the backend
        const result = await timesheetService.getTimesheetByEmployeeAndDate('02', selectedDate);

        if (result.success && result.data && result.data.activities && result.data.time_slots) {
          // Load saved activities
          setActivities(result.data.activities.map((activity: any, index: number) => ({
            id: activity.id || Date.now() + index,
            time: activity.time,
            type: activity.type,
            // Working fields
            project: activity.project || '',
            task: activity.task || '',
            // Meeting fields
            meetingType: activity.meetingType || '',
            participants: activity.participants || '',
            // Learning fields
            title: activity.title || '',
            notes: activity.notes || ''
          })));

          // Load saved time slots
          setTimeSlots(result.data.time_slots);
        } else {
          // No data for this date, reset to default empty state
          setActivities([]);
          setTimeSlots([
            { time: '09-10 AM', activity: null, label: 'Break' },
            { time: '10-11 AM', activity: null, label: 'Break' },
            { time: '11-12 AM', activity: null, label: 'Break' },
            { time: '12-01 PM', activity: null, label: 'Break' },
            { time: '01-02 PM', activity: null, label: 'Break' },
            { time: '02-03 PM', activity: null, label: 'Break' },
            { time: '03-04 PM', activity: null, label: 'Break' },
            { time: '04-05 PM', activity: null, label: 'Break' },
            { time: '05-06 PM', activity: null, label: 'Break' },
            { time: '06-07 PM', activity: null, label: 'Break' },
          ]);
        }
      } catch (error) {
        console.error('Error loading timesheet data:', error);
        // Reset to empty state on error
        setActivities([]);
        setTimeSlots([
          { time: '09-10 AM', activity: null, label: 'Break' },
          { time: '10-11 AM', activity: null, label: 'Break' },
          { time: '11-12 AM', activity: null, label: 'Break' },
          { time: '12-01 PM', activity: null, label: 'Break' },
          { time: '01-02 PM', activity: null, label: 'Break' },
          { time: '02-03 PM', activity: null, label: 'Break' },
          { time: '03-04 PM', activity: null, label: 'Break' },
          { time: '04-05 PM', activity: null, label: 'Break' },
          { time: '05-06 PM', activity: null, label: 'Break' },
          { time: '06-07 PM', activity: null, label: 'Break' },
        ]);
      }
    };

    loadTimesheetData();
  }, [selectedDate]);

  const timeDistribution = useMemo(() => {
    const counts = { working: 0, meeting: 0, learning: 0 };
    timeSlots.forEach(slot => {
      if (slot.activity && counts[slot.activity] !== undefined) {
        counts[slot.activity]++;
      }
    });
    return counts;
  }, [timeSlots]);

  const totalHours = useMemo(() => {
    return Object.values(timeDistribution).reduce((a, b) => a + b, 0);
  }, [timeDistribution]);



  const getSlotColor = (activity) => {
    if (!activity) return '#F59E0B'; // Yellow for break periods
    const type = activityTypes.find(t => t.value === activity);
    return type ? type.color : '#9CA3AF';
  };

  const openDatePicker = () => {
    setTempDate(new Date(selectedDate));
    setShowDatePicker(true);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setSelectedDate(formattedDate);
      setTempDate(selectedDate);
    }
  };

  const handleAddActivity = () => {
    setEditingActivity(null);
    setShowActivityModal(true);
  };

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setShowActivityModal(true);
  };

  const handleDeleteActivity = (id) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  const handleSaveActivity = (activityData) => {
    // Check for duplicate time slots when adding new activity
    if (!editingActivity) {
      const existingActivity = activities.find(a => a.time === activityData.time);
      if (existingActivity) {
        Alert.alert('Error', 'An activity already exists for this time slot. Please choose a different time or edit the existing activity.');
        return;
      }
    }

    let newActivities;
    if (editingActivity) {
      newActivities = activities.map(a =>
        a.id === editingActivity.id ? { ...activityData, id: a.id } : a
      );
      setActivities(newActivities);
    } else {
      const newActivity = { ...activityData, id: Date.now() };
      newActivities = [...activities, newActivity];
      setActivities(newActivities);
    }

    // Update timeSlots based on activities
    const updatedTimeSlots = timeSlots.map(slot => {
      const activity = newActivities.find(a => a.time === slot.time);
      if (activity) {
        return {
          ...slot,
          activity: activity.type,
          label: activityTypes.find(t => t.value === activity.type)?.label || 'Activity'
        };
      } else {
        return {
          ...slot,
          activity: null,
          label: 'Break'
        };
      }
    });
    setTimeSlots(updatedTimeSlots);

    setShowActivityModal(false);
  };

  const handleSaveTimesheet = async () => {
    setIsSaving(true);
    try {
      const result = await timesheetService.saveTimesheet({
        employeeName,
        date: selectedDate,
        timeSlots,
        activities,
      });

      if (result.success) {
        Alert.alert('Success', 'Timesheet saved successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to save timesheet');
      }
    } catch (error) {
      console.error('Error saving timesheet:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={['#ec407a', '#641b9a']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.header}>Daily Timesheet</Text>

        {/* Date and Employee Card */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.dateRow} onPress={openDatePicker}>
            <Text style={styles.label}>📅 Date:</Text>
            <Text style={styles.dateText}>{selectedDate}</Text>
          </TouchableOpacity>
          <View style={styles.employeeRow}>
            <Text style={styles.label}>Employee:</Text>
            <Text style={styles.employeeText}>{employeeName}</Text>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Time Distribution Chart */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Time Distribution</Text>

          <View style={styles.chartContainer}>
            <PieChart
              data={timeDistribution}
              activityTypes={activityTypes}
              totalHours={totalHours}
            />
          </View>

          <View style={styles.legendContainer}>
            {activityTypes.map(type => (
              <View key={type.value} style={styles.legendRow}>
                <View style={styles.legendLeft}>
                  <View style={[styles.legendDot, { backgroundColor: type.color }]} />
                  <Text style={styles.legendText}>{type.label}</Text>
                </View>
                <Text style={styles.legendHours}>{timeDistribution[type.value]}h</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>Total Hours</Text>
              <Text style={styles.totalHours}>{totalHours}h</Text>
            </View>
          </View>
        </View>

        {/* Time Slots Grid */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Time Slots</Text>

          <View style={styles.slotsGrid}>
            {timeSlots.map((slot, index) => (
              <View
                key={index}
                style={[
                  styles.slotButton,
                  { backgroundColor: getSlotColor(slot.activity) }
                ]}
              >
                <Text style={styles.slotTime}>{slot.time}</Text>
                <Text style={styles.slotLabel}>{slot.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Today's Activities */}
        <View style={styles.card}>
          <View style={styles.activitiesHeader}>
            <Text style={styles.sectionTitle}>Today's Activities</Text>
            <TouchableOpacity
              onPress={handleAddActivity}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activitiesList}>
            {activities.map(activity => {
              const activityType = activityTypes.find(t => t.value === activity.type);
              return (
                <View key={activity.id} style={styles.activityCard}>
                  <View style={styles.activityHeader}>
                    <View style={styles.activityHeaderLeft}>
                      <Text style={styles.activityTime}>{activity.time}</Text>
                      <View style={[styles.activityBadge, { backgroundColor: activityType?.color }]}>
                        <Text style={styles.activityBadgeText}>{activity.type.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.activityActions}>
                      <TouchableOpacity
                        onPress={() => handleEditActivity(activity)}
                        style={styles.actionButton}
                      >
                        <Text style={styles.actionIcon}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteActivity(activity.id)}
                        style={styles.actionButton}
                      >
                        <Text style={styles.actionIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {/* Display appropriate fields based on activity type */}
                  {activity.type === 'working' && (
                    <>
                      <Text style={styles.activityTitle}>
                        Project: {activity.project || 'N/A'}
                      </Text>
                      <Text style={styles.activityNotes}>
                        Task: {activity.task || 'N/A'}
                      </Text>
                    </>
                  )}

                  {activity.type === 'meeting' && (
                    <>
                      <Text style={styles.activityTitle}>
                        Type: {activity.meetingType || 'N/A'}
                      </Text>
                      <Text style={styles.activityNotes}>
                        Participants: {activity.participants || 'N/A'}
                      </Text>
                    </>
                  )}

                  {activity.type === 'learning' && (
                    <>
                      <Text style={styles.activityTitle}>{activity.title || 'N/A'}</Text>
                      <Text style={styles.activityNotes}>{activity.notes || 'N/A'}</Text>
                    </>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          onPress={handleSaveTimesheet}
          disabled={isSaving}
          style={[
            styles.saveTimesheetButton,
            isSaving && styles.saveTimesheetButtonDisabled,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveTimesheetButtonText}>Save Timesheet</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Activity Modal */}
      <ActivityModal
        visible={showActivityModal}
        activity={editingActivity}
        activityTypes={activityTypes}
        timeSlots={timeSlots}
        onSave={handleSaveActivity}
        onClose={() => setShowActivityModal(false)}
      />
    </LinearGradient>
  );
};

// Pie Chart Component
const PieChart = ({ data, activityTypes, totalHours }) => {
  const size = 180;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let currentOffset = 0;

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      {activityTypes.map((type, idx) => {
        const hours = data[type.value];
        if (hours === 0) return null;

        const percentage = hours / (totalHours || 1);
        const strokeDasharray = `${percentage * circumference} ${circumference}`;
        const strokeDashoffset = -currentOffset * circumference;
        currentOffset += percentage;

        return (
          <Circle
            key={idx}
            cx={center}
            cy={center}
            r={radius}
            stroke={type.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
          />
        );
      })}
    </Svg>
  );
};

// Activity Modal Component
const ActivityModal = ({ visible, activity, activityTypes, timeSlots, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    time: activity?.time || timeSlots[0].time,
    type: activity?.type || 'working',
    // Working fields
    project: activity?.project || '',
    task: activity?.task || '',
    // Meeting fields
    meetingType: activity?.meetingType || 'Internal',
    participants: activity?.participants || '',
    // Learning fields
    title: activity?.title || '',
    notes: activity?.notes || ''
  });

  const meetingTypes = [
    { value: 'Internal', label: 'Internal Meeting' },
    { value: 'Client', label: 'Client Meeting' },
    { value: 'Vendor', label: 'Vendor Meeting' },
    { value: 'Team', label: 'Team Meeting' },
    { value: 'Review', label: 'Review Meeting' },
    { value: 'Planning', label: 'Planning Meeting' },
  ];

  React.useEffect(() => {
    if (visible) {
      setFormData({
        time: activity?.time || timeSlots[0].time,
        type: activity?.type || 'working',
        // Working fields
        project: activity?.project || '',
        task: activity?.task || '',
        // Meeting fields
        meetingType: activity?.meetingType || 'Internal',
        participants: activity?.participants || '',
        // Learning fields
        title: activity?.title || '',
        notes: activity?.notes || ''
      });
    }
  }, [visible, activity]);

  const handleSubmit = () => {
    // Validation based on activity type
    if (formData.type === 'working') {
      if (!formData.project.trim() || !formData.task.trim()) {
        Alert.alert('Error', 'Please fill in both Project and Task fields for working activities.');
        return;
      }
    } else if (formData.type === 'meeting') {
      if (!formData.participants.trim()) {
        Alert.alert('Error', 'Please fill in the Participants field for meeting activities.');
        return;
      }
    } else if (formData.type === 'learning') {
      if (!formData.title.trim()) {
        Alert.alert('Error', 'Please fill in the Title field for learning activities.');
        return;
      }
    }

    onSave(formData);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {activity ? 'Edit Activity' : 'Add Activity'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Time Slot</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.time}
                onValueChange={(itemValue) => setFormData({ ...formData, time: itemValue })}
                style={styles.picker}
              >
                {timeSlots.map(slot => (
                  <Picker.Item key={slot.time} label={slot.time} value={slot.time} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Activity Type</Text>
            <View style={styles.typeButtons}>
              {activityTypes.map(type => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setFormData({ ...formData, type: type.value })}
                  style={[
                    styles.typeButton,
                    formData.type === type.value && { backgroundColor: type.color }
                  ]}
                >
                  <Text style={[
                    styles.typeButtonText,
                    formData.type === type.value && styles.typeButtonTextActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Conditional Fields Based on Activity Type */}
          {formData.type === 'working' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Project</Text>
                <TextInput
                  style={styles.input}
                  value={formData.project}
                  onChangeText={(text) => setFormData({ ...formData, project: text })}
                  placeholder="Enter project name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Task</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.task}
                  onChangeText={(text) => setFormData({ ...formData, task: text })}
                  placeholder="Describe the task"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </>
          )}

          {formData.type === 'meeting' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Meeting Type</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.meetingType}
                    onValueChange={(itemValue) => setFormData({ ...formData, meetingType: itemValue })}
                    style={styles.picker}
                  >
                    {meetingTypes.map(type => (
                      <Picker.Item key={type.value} label={type.label} value={type.value} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Participants</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.participants}
                  onChangeText={(text) => setFormData({ ...formData, participants: text })}
                  placeholder="List meeting participants"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </>
          )}

          {formData.type === 'learning' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Enter learning session title"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="Add notes about the learning session"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalButton, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.modalButton, styles.saveButton]}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  employeeText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  hint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  legendContainer: {
    marginTop: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  legendHours: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: 8,
  },
  totalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalHours: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  slotButton: {
    width: (width - 120) / 5,  // Adjusted to create space between cards
    aspectRatio: 1,
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    marginHorizontal: 4,  // Add horizontal margin for spacing
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotTime: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  slotLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    textAlign: 'center',
  },
  activitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  activitiesList: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityTime: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  activityActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  actionIcon: {
    fontSize: 16,
  },
  activityTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityNotes: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#A855F7',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pickerWrapper: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  saveTimesheetButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveTimesheetButtonDisabled: {
    opacity: 0.6,
  },
  saveTimesheetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default DailyTimesheet;

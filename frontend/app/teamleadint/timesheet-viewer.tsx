import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { timesheetService } from '../services/timesheetService';

const { width } = Dimensions.get('window');

interface TimesheetRecord {
  id: string;
  employee_id?: string;
  employeeName: string;
  date: string;
  timeSlots: any[];
  activities: any[];
  status?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  review_notes?: string;
}

const TeamLeadTimesheetViewer = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [timesheetData, setTimesheetData] = useState<TimesheetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewingTimesheet, setReviewingTimesheet] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      setSelectedDate(formattedDate);
      setTempDate(date);
    }
  };

  const fetchTimesheet = useCallback(async () => {
    if (!selectedEmployee || !selectedDate) {
      Alert.alert('Error', 'Please enter employee name and select a date');
      return;
    }

    setLoading(true);
    try {
      const result = await timesheetService.getTimesheetByEmployeeAndDate(
        selectedEmployee,
        selectedDate
      );

      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data : [result.data];
        setTimesheetData(data);
      } else {
        Alert.alert('Info', result.message || 'No timesheet data found');
        setTimesheetData([]);
      }
    } catch (error) {
      console.error('Error fetching timesheet:', error);
      Alert.alert('Error', 'Failed to fetch timesheet data');
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee, selectedDate]);

  const timeDistribution = useMemo(() => {
    const distribution: { [key: string]: any[] } = {};

    timesheetData.forEach(record => {
      if (record.timeSlots) {
        record.timeSlots.forEach((slot: any) => {
          if (slot.activity) {
            if (!distribution[slot.activity]) {
              distribution[slot.activity] = [];
            }
            distribution[slot.activity].push(slot);
          }
        });
      }
    });

    return distribution;
  }, [timesheetData]);

  const handleApproveTimesheet = useCallback(async (employeeId: string, date: string) => {
    try {
      const result = await timesheetService.reviewTimesheet({
        employee_id: employeeId,
        date: date,
        status: 'approved',
        reviewer_id: 'TL001', // This should come from logged-in user context
        reviewer_name: 'Team Leader',
        review_notes: reviewNotes
      });

      if (result.success) {
        Alert.alert('Success', 'Timesheet approved successfully');
        setShowReviewModal(false);
        setReviewNotes('');
        setReviewingTimesheet(null);
        // Refresh the data
        fetchTimesheet();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to approve timesheet');
    }
  }, [reviewNotes, fetchTimesheet]);

  const handleRejectTimesheet = useCallback(async (employeeId: string, date: string) => {
    try {
      const result = await timesheetService.reviewTimesheet({
        employee_id: employeeId,
        date: date,
        status: 'rejected',
        reviewer_id: 'TL001', // This should come from logged-in user context
        reviewer_name: 'Team Leader',
        review_notes: reviewNotes
      });

      if (result.success) {
        Alert.alert('Success', 'Timesheet rejected');
        setShowReviewModal(false);
        setReviewNotes('');
        setReviewingTimesheet(null);
        // Refresh the data
        fetchTimesheet();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reject timesheet');
    }
  }, [reviewNotes, fetchTimesheet]);

  const handleExportPDF = useCallback(async (employeeId: string, date: string) => {
    try {
      const result = await timesheetService.exportTimesheetPDF(employeeId, date);
      if (result.success && result.data) {
        // Open the download URL in the device's default browser
        await Linking.openURL(result.data);
        Alert.alert('Success', 'PDF opened in browser for download');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Export PDF error:', error);
      Alert.alert('Error', 'Failed to export PDF');
    }
  }, []);

  const handleExportExcel = useCallback(async (employeeId: string, date: string) => {
    try {
      const result = await timesheetService.exportTimesheetExcel(employeeId, date);
      if (result.success && result.data) {
        // Open the download URL in the device's default browser
        await Linking.openURL(result.data);
        Alert.alert('Success', 'Excel opened in browser for download');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Export Excel error:', error);
      Alert.alert('Error', 'Failed to export Excel');
    }
  }, []);

  const renderTimesheetRecord = ({ item }: { item: TimesheetRecord }) => (
    <View style={styles.timesheetCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.employeeName}>{item.employeeName}</Text>
          <Text style={styles.date}>{item.date}</Text>
          {item.status && (
            <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => handleExportPDF(item.employee_id || item.employeeName, item.date)}
          >
            <Text style={styles.exportButtonText}>PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => handleExportExcel(item.employee_id || item.employeeName, item.date)}
          >
            <Text style={styles.exportButtonText}>Excel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Review Information */}
      {(item.reviewer_name || item.review_notes) && (
        <View style={styles.reviewInfo}>
          {item.reviewer_name && (
            <Text style={styles.reviewText}>Reviewed by: {item.reviewer_name}</Text>
          )}
          {item.reviewed_at && (
            <Text style={styles.reviewText}>Reviewed on: {new Date(item.reviewed_at).toLocaleDateString()}</Text>
          )}
          {item.review_notes && (
            <Text style={styles.reviewNotes}>Notes: {item.review_notes}</Text>
          )}
        </View>
      )}

      {/* Approval Buttons - Only show if status is pending */}
      {(!item.status || item.status === 'pending') && (
        <View style={styles.approvalButtons}>
          <TouchableOpacity
            style={[styles.approvalButton, styles.approveButton]}
            onPress={() => {
              setReviewingTimesheet(`${item.employee_id || item.employeeName}|||${item.date}`);
              setShowReviewModal(true);
            }}
          >
            <Text style={styles.approveButtonText}>Review</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.activities && item.activities.length > 0 && (
        <View style={styles.activitiesSection}>
          <Text style={styles.sectionTitle}>Activities</Text>
          {item.activities.map((activity: any, index: number) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityHeader}>
                <View style={styles.activityTimeType}>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                  <View
                    style={[
                      styles.activityBadge,
                      {
                        backgroundColor: getActivityColor(activity.type),
                      },
                    ]}
                  >
                    <Text style={styles.activityBadgeText}>
                      {activity.type.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.activityMeta}>
                  <Text style={styles.activityDuration}>1h</Text>
                  <Text style={styles.activityStatus}>Completed</Text>
                </View>
              </View>

              <View style={styles.activityDetails}>
                {/* Display activity details based on type */}
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
                      Meeting Type: {activity.meetingType || 'N/A'}
                    </Text>
                    <Text style={styles.activityNotes}>
                      Participants: {activity.participants || 'N/A'}
                    </Text>
                  </>
                )}

                {activity.type === 'learning' && (
                  <>
                    <Text style={styles.activityTitle}>
                      Title: {activity.title || 'N/A'}
                    </Text>
                    <Text style={styles.activityNotes}>
                      Notes: {activity.notes || 'N/A'}
                    </Text>
                  </>
                )}

                {/* For other activity types, show all available fields */}
                {activity.type !== 'working' && activity.type !== 'meeting' && activity.type !== 'learning' && (
                  <>
                    {activity.title && (
                      <Text style={styles.activityTitle}>
                        Title: {activity.title}
                      </Text>
                    )}
                    {activity.notes && (
                      <Text style={styles.activityNotes}>
                        Notes: {activity.notes}
                      </Text>
                    )}
                    {activity.project && (
                      <Text style={styles.activityNotes}>
                        Project: {activity.project}
                      </Text>
                    )}
                    {activity.task && (
                      <Text style={styles.activityNotes}>
                        Task: {activity.task}
                      </Text>
                    )}
                    {activity.meetingType && (
                      <Text style={styles.activityNotes}>
                        Meeting Type: {activity.meetingType}
                      </Text>
                    )}
                    {activity.participants && (
                      <Text style={styles.activityNotes}>
                        Participants: {activity.participants}
                      </Text>
                    )}
                  </>
                )}

                <View style={styles.activityAdditionalInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Employee:</Text>
                    <Text style={styles.infoValue}>{item.employeeName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Date:</Text>
                    <Text style={styles.infoValue}>{item.date}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Time Slot:</Text>
                    <Text style={styles.infoValue}>{activity.time}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Category:</Text>
                    <Text style={styles.infoValue}>{activity.type}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {item.timeSlots && item.timeSlots.length > 0 && (
        <View style={styles.timeSlotsSection}>
          <Text style={styles.sectionTitle}>Time Distribution</Text>
          <View style={styles.timeSlotsGrid}>
            {item.timeSlots.map((slot: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.slotBox,
                  {
                    backgroundColor: getActivityColor(slot.activity),
                  },
                ]}
              >
                <Text style={styles.slotTime}>{slot.time}</Text>
                <Text style={styles.slotLabel}>{slot.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <LinearGradient
      colors={['#ec407a', '#641b9a']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Employee Timesheet Review</Text>

        <View style={styles.searchCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Employee Name or ID</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter employee name or ID"
              placeholderTextColor="#9CA3AF"
              value={selectedEmployee}
              onChangeText={setSelectedEmployee}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setTempDate(new Date(selectedDate));
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.dateButtonText}>{selectedDate}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={fetchTimesheet}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {timesheetData.length > 0 && Object.keys(timeDistribution).length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryGrid}>
              {Object.entries(timeDistribution).map(([activityType, slots]) => (
                <View key={activityType} style={styles.summaryItem}>
                  <View
                    style={[
                      styles.summaryColorBox,
                      { backgroundColor: getActivityColor(activityType) }
                    ]}
                  />
                  <Text style={styles.summaryLabel}>
                    {activityType.charAt(0).toUpperCase() + activityType.slice(1)}
                  </Text>
                  <Text style={styles.summaryCount}>
                    {slots.length}h
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {timesheetData.length > 0 ? (
          <View style={styles.listContainer}>
            <FlatList
              data={timesheetData}
              renderItem={renderTimesheetRecord}
              keyExtractor={(item, index) => `${item.employeeName}-${item.date}-${index}`}
              scrollEnabled={false}
            />
          </View>
        ) : loading ? null : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No timesheet data found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try searching by employee name, date, or both
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && reviewingTimesheet && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Review Timesheet</Text>

            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Please review the timesheet and add any notes if necessary.
              </Text>

              <TextInput
                style={styles.modalTextInput}
                placeholder="Add review notes (optional)"
                placeholderTextColor="#9CA3AF"
                value={reviewNotes}
                onChangeText={setReviewNotes}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowReviewModal(false);
                  setReviewNotes('');
                  setReviewingTimesheet(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.rejectButton]}
                onPress={() => {
                  const [employeeId, date] = reviewingTimesheet.split('|||');
                  console.log('Rejecting timesheet:', { employeeId, date, reviewingTimesheet });
                  handleRejectTimesheet(employeeId, date);
                }}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.approveButton]}
                onPress={() => {
                  const [employeeId, date] = reviewingTimesheet.split('|||');
                  console.log('Approving timesheet:', { employeeId, date, reviewingTimesheet });
                  handleApproveTimesheet(employeeId, date);
                }}
              >
                <Text style={styles.approveButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </LinearGradient>
  );
};

const getActivityColor = (activity: string | null) => {
  if (!activity) return '#E5E7EB';
  if (activity === 'working') return '#3B82F6';
  if (activity === 'meeting') return '#A855F7';
  if (activity === 'learning') return '#22C55E';
  if (activity === 'break') return '#F59E0B';
  if (activity === 'lunch') return '#EF4444';
  if (activity === 'tea') return '#8B5CF6';
  if (activity === 'training') return '#06B6D4';
  if (activity === 'personal') return '#EC4899';
  if (activity === 'other') return '#6B7280';
  return '#9CA3AF'; // Default gray for unknown activity types
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'approved':
      return { backgroundColor: '#10B981' }; // Green
    case 'rejected':
      return { backgroundColor: '#EF4444' }; // Red
    case 'pending':
    default:
      return { backgroundColor: '#F59E0B' }; // Yellow
  }
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  searchCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchTypeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  searchTypeButtonActive: {
    backgroundColor: '#10B981',
  },
  searchTypeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  searchTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  dateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#000',
  },
  searchButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  summaryColorBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 4,
  },
  summaryCount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  timesheetCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  date: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  activitiesSection: {
    marginBottom: 12,
  },
  activityItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  activityTimeType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  activityTime: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  activityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activityBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  activityDetails: {
    gap: 4,
  },
  activityTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  activityNotes: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  timeSlotsSection: {
    marginTop: 12,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBox: {
    width: (width - 72) / 5,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTime: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  slotLabel: {
    color: '#FFFFFF',
    fontSize: 8,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityMeta: {
    alignItems: 'flex-end',
  },
  activityDuration: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityStatus: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '500',
  },
  activityAdditionalInfo: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  reviewInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 4,
  },
  reviewNotes: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  approvalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  approvalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#000',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalTextInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
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
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TeamLeadTimesheetViewer;

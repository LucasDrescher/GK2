// Importerer nødvendige React og React Native komponenter
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { rtdb } from "../../database/firebase";
import { ref, onValue } from "firebase/database";
import { globalStyles, colors } from "../../styles";
import { StatCard } from "../../components";

const { width, height } = Dimensions.get("window");

export default function AdminDashboardScreen({ route, navigation }) {
  const { companyCode } = route.params;

  // Debug: print incoming params and initial state to help diagnose missing UI
  React.useEffect(() => {
    console.log('AdminDashboard mounted - companyCode:', companyCode);
  }, [companyCode]);

  // State management
  const [shifts, setShifts] = useState({});
  const [employees, setEmployees] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // Ny tab navigation
  const [selectedEventId, setSelectedEventId] = useState(null); // For event-specifik økonomi

  // Firebase data listeners
  useEffect(() => {
    if (!companyCode) return;

    const shiftsRef = ref(rtdb, `companies/${companyCode}/shifts`);
    const unsubscribeShifts = onValue(shiftsRef, (snapshot) => {
      const data = snapshot.val();
      setShifts(data || {});
    });

    const employeesRef = ref(rtdb, `companies/${companyCode}/employees`);
    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const filteredEmployees = {};
        Object.entries(data).forEach(([id, emp]) => {
          if (emp.role === "employee") {
            filteredEmployees[id] = emp;
          }
        });
        setEmployees(filteredEmployees);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeShifts();
      unsubscribeEmployees();
    };
  }, [companyCode]);

  // Events listener for dashboard preview
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // Alle events til beregninger
  useEffect(() => {
    if (!companyCode) return;
    const eventsRef = ref(rtdb, `companies/${companyCode}/events`);
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      setAllEvents(list); // Gem alle events
      setEvents(list.slice(0, 3)); // preview up to 3
    });
    return () => unsubscribe();
  }, [companyCode]);

  // Data calculations
  const calculateMetrics = () => {
    const shiftArray = Object.values(shifts);
    const employeeArray = Object.values(employees);
    
    const totalEmployees = employeeArray.length;
    const totalShifts = shiftArray.length;
    
    // Calculate total work hours from shifts
    let totalWorkHours = 0;
    shiftArray.forEach(shift => {
      if (shift.startTime && shift.endTime && shift.assignedTo?.length) {
        const [startHour, startMin] = shift.startTime.split(':').map(Number);
        const [endHour, endMin] = shift.endTime.split(':').map(Number);
        const hours = (endHour + endMin/60) - (startHour + startMin/60);
        totalWorkHours += hours * shift.assignedTo.length;
      }
    });

    // Real calculations where possible, N/A for data not yet available
    const avgHoursPerEmployee = totalEmployees > 0 ? totalWorkHours / totalEmployees : 0;
    
    // Beregn godkendte og afventende timer fra events
    let approvedHours = 0;
    let pendingHours = 0;
    let approvedWageCost = 0;
    
    allEvents.forEach(event => {
      if (event.assignedEmployees) {
        Object.entries(event.assignedEmployees).forEach(([empId, empData]) => {
          if (empData.hoursApproved) {
            approvedHours += empData.hoursWorked || 0;
            approvedWageCost += empData.totalCost || 0;
          } else if (!empData.hoursRejected) {
            // Beregn planlagte timer
            if (event.startTime && event.endTime) {
              const [startH, startM] = event.startTime.split(':').map(Number);
              const [endH, endM] = event.endTime.split(':').map(Number);
              const hours = (endH + endM/60) - (startH + startM/60);
              pendingHours += hours;
            }
          }
        });
      }
    });
    
    // Beregn total lønudgift fra events
    const totalEventWageCost = allEvents.reduce((sum, event) => {
      return sum + (event.totalWageCost || 0);
    }, 0);
    
    // Beregn total budget fra events
    const totalBudget = allEvents.reduce((sum, event) => {
      return sum + (event.budget || 0);
    }, 0);
    
    // Beregn total timer arbejdet fra events
    const totalHoursWorked = allEvents.reduce((sum, event) => {
      if (event.assignedEmployees) {
        const eventHours = Object.values(event.assignedEmployees).reduce((h, emp) => h + (emp.hoursWorked || 0), 0);
        return sum + eventHours;
      }
      return sum;
    }, 0);
    
    // Beregn andre udgifter fra events (baseret på expenses array)
    const otherExpenses = allEvents.reduce((sum, event) => {
      if (event.expenses && Array.isArray(event.expenses)) {
        const expensesTotal = event.expenses.reduce((eSum, e) => eSum + parseFloat(e.amount || 0), 0);
        return sum + expensesTotal;
      }
      // Fallback til old otherExpenses field
      return sum + (event.otherExpenses || 0);
    }, 0);
    
    // Beregn total budget (samlet budget, ikke kun personale)
    const totalEventBudget = allEvents.reduce((sum, event) => {
      return sum + (event.totalBudget || event.budget || 0);
    }, 0);
    
    // Beregn lønprocent
    const wagePercentage = totalEventBudget > 0 ? (totalEventWageCost / totalEventBudget) * 100 : 0;
    
    const estimatedWageCost = totalEventWageCost;
    const totalExpenses = estimatedWageCost + otherExpenses;
    const remainingBudget = totalEventBudget - totalExpenses;
    
    const attendanceRate = null; // N/A - needs attendance tracking
    const cancellationRate = null; // N/A - needs cancellation tracking
    
    const activeShifts = null; // N/A - needs shift status tracking
    const completionRate = null; // N/A - needs completion tracking
    const eventStatusScore = null; // N/A - depends on attendance and completion data

    return {
      // Overview
      totalEmployees,
      totalShifts,
      totalWorkHours: Math.round(totalWorkHours),
      approvedHours: Math.round(approvedHours * 10) / 10,
      pendingHours: Math.round(pendingHours * 10) / 10,
      approvedWageCost,
      
      // Economy
      estimatedWageCost,
      totalExpenses,
      totalBudget: totalEventBudget,
      remainingBudget,
      wagePercentage,
      totalHoursWorked,
      otherExpenses,
    };
  };

  // Tab navigation
  const renderTabNavigation = () => (
    <View style={globalStyles.tabContainer}>
      <TouchableOpacity 
        style={[globalStyles.tab, activeTab === "overview" && globalStyles.activeTab]}
        onPress={() => setActiveTab("overview")}
      >
        <Text style={[globalStyles.tabText, activeTab === "overview" && globalStyles.activeTabText]}>
          Oversigt
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[globalStyles.tab, activeTab === "economy" && globalStyles.activeTab]}
        onPress={() => setActiveTab("economy")}
      >
        <Text style={[globalStyles.tabText, activeTab === "economy" && globalStyles.activeTabText]}>
          Økonomi
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Overview tab content
  const renderOverview = () => {
    const metrics = calculateMetrics();
    
    return (
      <View style={globalStyles.contentContainer}>
        <Text style={globalStyles.sectionTitle}>Oversigt</Text>
        
        <View style={globalStyles.statsGrid}>
          <StatCard 
            value={metrics.totalEmployees}
            label="Samlet antal medarbejdere"
            icon={<Ionicons name="people" size={28} color={colors.white} />}
            gradientColors={[colors.primary, colors.primaryDark]}
          />
          
          <StatCard 
            value={`${metrics.approvedHours}h`}
            label="Godkendte timer"
            icon={<Ionicons name="checkmark-circle" size={28} color={colors.white} />}
            gradientColors={['#10B981', '#059669']}
          />
          
          <StatCard 
            value={`${metrics.pendingHours}h`}
            label="Afventende timer"
            icon={<Ionicons name="time" size={28} color={colors.white} />}
            gradientColors={['#F59E0B', '#D97706']}
          />
        </View>

        {/* Events liste */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={globalStyles.sectionTitle}>Events</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AdminEventList', { companyCode })}
              style={{ paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text style={{ color: '#4F46E5', fontSize: 14, fontWeight: '600' }}>Se alle</Text>
            </TouchableOpacity>
          </View>
          
          {allEvents.length === 0 ? (
            <View style={[globalStyles.statCard, { padding: 24 }]}>
              <Text style={{ color: '#6B7280', textAlign: 'center' }}>Ingen events oprettet endnu</Text>
            </View>
          ) : (
            <View>
              {allEvents.slice(0, 5).map((event) => {
                const totalWage = event.totalWageCost || 0;
                // Calculate other expenses from expenses array
                let otherExp = 0;
                if (event.expenses && Array.isArray(event.expenses)) {
                  otherExp = event.expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
                } else {
                  otherExp = event.otherExpenses || 0;
                }
                const totalExp = totalWage + otherExp;
                const budget = event.totalBudget || event.budget || 0;
                const remaining = budget - totalExp;
                
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                    onPress={() => {
                      // Serialize assignedEmployees to avoid navigation error
                      const sanitizedEvent = {
                        ...event,
                        assignedEmployees: event.assignedEmployees || {}
                      };
                      navigation.navigate('AdminCreateEvent', { 
                        companyCode,
                        eventId: event.id,
                        existingEvent: sanitizedEvent,
                        isEditing: true
                      });
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', flex: 1 }}>
                        {event.title}
                      </Text>
                      <Text style={{ fontSize: 14, color: '#6B7280' }}>
                        {event.date}
                      </Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>Lønudgift</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#4F46E5' }}>
                          {totalWage.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kr
                        </Text>
                      </View>
                      
                      {otherExp > 0 && (
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, color: '#6B7280' }}>Andre udgifter</Text>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#4F46E5' }}>
                            {otherExp.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kr
                          </Text>
                        </View>
                      )}
                      
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>Resterende</Text>
                        <Text style={{ 
                          fontSize: 14, 
                          fontWeight: '600', 
                          color: remaining < 0 ? '#EF4444' : '#10B981' 
                        }}>
                          {remaining.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kr
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  };

  // Economy tab content
  const renderEconomy = () => {
    const metrics = calculateMetrics();
    
    // Hvis et event er valgt, vis event-specifik økonomi
    if (selectedEventId) {
      const event = allEvents.find(e => e.id === selectedEventId);
      if (!event) {
        setSelectedEventId(null);
        return null;
      }
      
      const totalWage = event.totalWageCost || 0;
      let otherExp = 0;
      if (event.expenses && Array.isArray(event.expenses)) {
        otherExp = event.expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      } else {
        otherExp = event.otherExpenses || 0;
      }
      const totalExp = totalWage + otherExp;
      const budget = event.totalBudget || event.budget || 0;
      const remaining = budget - totalExp;
      
      // Beregn timer for dette event
      let eventApprovedHours = 0;
      let eventPendingHours = 0;
      if (event.assignedEmployees) {
        Object.values(event.assignedEmployees).forEach(emp => {
          if (emp.hoursApproved) {
            eventApprovedHours += emp.hoursWorked || 0;
          } else if (!emp.hoursRejected && event.startTime && event.endTime) {
            const [startH, startM] = event.startTime.split(':').map(Number);
            const [endH, endM] = event.endTime.split(':').map(Number);
            const hours = (endH + endM/60) - (startH + startM/60);
            eventPendingHours += hours;
          }
        });
      }
      
      return (
        <View style={globalStyles.contentContainer}>
          <TouchableOpacity
            onPress={() => setSelectedEventId(null)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary, marginLeft: 8 }}>
              Tilbage til samlet økonomi
            </Text>
          </TouchableOpacity>
          
          <Text style={globalStyles.sectionTitle}>{event.title}</Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 20 }}>
            {event.date} • {event.startTime} - {event.endTime}
          </Text>
          
          <View style={globalStyles.statsGrid}>
            <StatCard 
              value={`${totalWage.toLocaleString('da-DK', { minimumFractionDigits: 0 })} kr`}
              label="Lønudgift"
              icon={<Ionicons name="cash" size={28} color={colors.white} />}
              gradientColors={['#8B5CF6', '#7C3AED']}
            />
            
            <StatCard 
              value={`${otherExp.toLocaleString('da-DK', { minimumFractionDigits: 0 })} kr`}
              label="Andre udgifter"
              icon={<Ionicons name="receipt" size={28} color={colors.white} />}
              gradientColors={['#EC4899', '#DB2777']}
            />
            
            <StatCard 
              value={`${budget.toLocaleString('da-DK', { minimumFractionDigits: 0 })} kr`}
              label="Budget"
              icon={<Ionicons name="wallet" size={28} color={colors.white} />}
              gradientColors={[colors.secondary, '#0891B2']}
            />
            
            <StatCard 
              value={`${remaining.toLocaleString('da-DK', { minimumFractionDigits: 0 })} kr`}
              label="Resterende"
              icon={<Ionicons name={remaining < 0 ? "trending-down" : "trending-up"} size={28} color={colors.white} />}
              gradientColors={remaining < 0 ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
            />
            
            <StatCard 
              value={`${eventApprovedHours.toFixed(1)}h`}
              label="Godkendte timer"
              icon={<Ionicons name="checkmark-circle" size={28} color={colors.white} />}
              gradientColors={['#10B981', '#059669']}
            />
            
            <StatCard 
              value={`${eventPendingHours.toFixed(1)}h`}
              label="Afventende timer"
              icon={<Ionicons name="time" size={28} color={colors.white} />}
              gradientColors={['#F59E0B', '#D97706']}
            />
          </View>
        </View>
      );
    }
    
    return (
      <View style={globalStyles.contentContainer}>
        <Text style={globalStyles.sectionTitle}>Økonomisk Overblik</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 20 }}>
          Samlet økonomi for alle events
        </Text>
        
        <View style={globalStyles.statsGrid}>
          <StatCard 
            value={`${metrics.estimatedWageCost.toLocaleString('da-DK', { minimumFractionDigits: 0 })} kr`}
            label="Samlet lønudgift"
            icon={<Ionicons name="people" size={28} color={colors.white} />}
            gradientColors={['#8B5CF6', '#7C3AED']}
          />
          
          <StatCard 
            value={`${metrics.wagePercentage.toFixed(1)}%`}
            label="Lønprocent af budget"
            icon={<Ionicons name="pie-chart" size={28} color={colors.white} />}
            gradientColors={metrics.wagePercentage > 100 ? ['#EF4444', '#DC2626'] : [colors.primary, colors.primaryDark]}
          />
          
          <StatCard 
            value={`${metrics.totalHoursWorked.toFixed(1)}h`}
            label="Timer arbejdet"
            icon={<Ionicons name="time" size={28} color={colors.white} />}
            gradientColors={[colors.secondary, '#0891B2']}
          />
          
          <StatCard 
            value={`${metrics.otherExpenses.toLocaleString('da-DK', { minimumFractionDigits: 0 })} kr`}
            label="Andre udgifter"
            icon={<Ionicons name="receipt" size={28} color={colors.white} />}
            gradientColors={['#EC4899', '#DB2777']}
          />
          
          <StatCard 
            value={`${metrics.totalBudget.toLocaleString('da-DK', { minimumFractionDigits: 0 })} kr`}
            label="Samlet budget"
            icon={<Ionicons name="wallet" size={28} color={colors.white} />}
            gradientColors={['#14B8A6', '#0D9488']}
          />
          
          <StatCard 
            value={`${metrics.remainingBudget.toLocaleString('da-DK', { minimumFractionDigits: 0 })} kr`}
            label="Resterende budget"
            icon={<Ionicons name={metrics.remainingBudget < 0 ? "trending-down" : "trending-up"} size={28} color={colors.white} />}
            gradientColors={metrics.remainingBudget < 0 ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
          />
        </View>
        
        {/* Event selector */}
        <View style={{ marginTop: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
            Se event-specifik økonomi
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {allEvents.map(event => {
                const totalWage = event.totalWageCost || 0;
                let otherExp = 0;
                if (event.expenses && Array.isArray(event.expenses)) {
                  otherExp = event.expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
                } else {
                  otherExp = event.otherExpenses || 0;
                }
                const budget = event.totalBudget || event.budget || 0;
                const remaining = budget - totalWage - otherExp;
                
                return (
                  <TouchableOpacity
                    key={event.id}
                    onPress={() => setSelectedEventId(event.id)}
                    style={{
                      backgroundColor: colors.white,
                      borderRadius: 12,
                      padding: 16,
                      minWidth: 200,
                      borderWidth: 2,
                      borderColor: colors.gray200,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
                      {event.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
                      {event.date}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: remaining < 0 ? colors.error : colors.success }}>
                      {remaining.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kr tilbage
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  // Render current tab content
  const renderCurrentTab = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "economy":
        return renderEconomy();
      default:
        return renderOverview();
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={globalStyles.loadingText}>Indlæser dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main render
  return (
    <SafeAreaView style={globalStyles.dashboardContainer}>
      <View style={globalStyles.dashboardHeader}>
        <Text style={globalStyles.dashboardTitle}>Admin Dashboard</Text>
      </View>
      
      {renderTabNavigation()}
      
      <ScrollView style={globalStyles.tabContent}>
        {renderCurrentTab()}
      </ScrollView>
    </SafeAreaView>
  );
}
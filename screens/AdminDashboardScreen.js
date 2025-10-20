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
import { rtdb } from "../database/firebase";
import { ref, onValue } from "firebase/database";
import { globalStyles } from "../styles";

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
  useEffect(() => {
    if (!companyCode) return;
    const eventsRef = ref(rtdb, `companies/${companyCode}/events`);
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
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
    
    // These will be replaced with real data when available
    const estimatedWageCost = null; // N/A - needs hourly rate input
    const otherExpenses = null; // N/A - needs user input for other costs
    const totalExpenses = null; // N/A - depends on above
    const revenue = null; // N/A - needs revenue input
    const profit = null; // N/A - depends on revenue and expenses
    const wagePercentage = null; // N/A - depends on expenses
    const costPerHour = null; // N/A - depends on expenses
    
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
      attendanceRate: attendanceRate || 'N/A',
      
      // Economy
      estimatedWageCost,
      totalExpenses,
      revenue,
      profit,
      wagePercentage,
      costPerHour,
      
      // Staff
      avgHoursPerEmployee,
      cancellationRate,
      
      // Efficiency
      activeShifts,
      completionRate,
      eventStatusScore
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
      
      <TouchableOpacity 
        style={[globalStyles.tab, activeTab === "staff" && globalStyles.activeTab]}
        onPress={() => setActiveTab("staff")}
      >
        <Text style={[globalStyles.tabText, activeTab === "staff" && globalStyles.activeTabText]}>
          Personale
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[globalStyles.tab, activeTab === "efficiency" && globalStyles.activeTab]}
        onPress={() => setActiveTab("efficiency")}
      >
        <Text style={[globalStyles.tabText, activeTab === "efficiency" && globalStyles.activeTabText]}>
          Effektivitet
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[globalStyles.tab, activeTab === "events" && globalStyles.activeTab]}
        onPress={() => setActiveTab("events")}
      >
        <Text style={[globalStyles.tabText, activeTab === "events" && globalStyles.activeTabText]}>
          Events
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Overview tab content
  const renderOverview = () => {
    const metrics = calculateMetrics();
    
    return (
      <View style={globalStyles.contentContainer}>
        <Text style={globalStyles.sectionTitle}>Dashboard Oversigt</Text>
        
        <View style={globalStyles.statsGrid}>
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>{metrics.totalEmployees}</Text>
            <Text style={globalStyles.statLabel}>Medarbejdere</Text>
          </View>
          
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>{metrics.totalShifts}</Text>
            <Text style={globalStyles.statLabel}>Vagter</Text>
          </View>
          
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>{metrics.totalWorkHours}h</Text>
            <Text style={globalStyles.statLabel}>Arbejdstimer</Text>
          </View>
          
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>{metrics.attendanceRate}%</Text>
            <Text style={globalStyles.statLabel}>Fremmøde</Text>
          </View>
        </View>
        
        {/* Events preview (horizontal) */}
        <View style={{ marginTop: 20 }}>
          <Text style={globalStyles.subsectionTitle}>Kommende events</Text>
          {events.length === 0 ? (
            <Text style={globalStyles.noShiftsText}>Ingen kommende events</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
              {events.map((ev) => (
                <TouchableOpacity
                  key={ev.id}
                  style={[globalStyles.weekShiftCard, { width: Math.min(320, width - 40), marginLeft: 16 }]}
                  onPress={() => navigation.navigate('EditEvent', { companyCode, event: ev, eventId: ev.id })}
                >
                  <Text style={globalStyles.weekShiftTime}>{ev.startTime ? ev.startTime : ''} {ev.endTime ? ' - ' + ev.endTime : ''}</Text>
                  <Text style={globalStyles.weekShiftArea}>{ev.title}</Text>
                  <Text style={globalStyles.weekShiftEmployees}>{ev.date} {ev.location ? '• ' + ev.location : ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    );
  };

  const renderEvents = () => {
    return (
      <View style={globalStyles.contentContainer}>
        <Text style={globalStyles.sectionTitle}>Events</Text>

        {events.length === 0 ? (
          <Text style={globalStyles.noShiftsText}>Ingen events fundet</Text>
        ) : (
          events.map((ev) => (
            <TouchableOpacity
              key={ev.id}
              style={[globalStyles.shiftCard, { marginHorizontal: 0, marginBottom: 10 }]}
              onPress={() => navigation.navigate('EditEvent', { companyCode, event: ev, eventId: ev.id })}
            >
              <View style={globalStyles.shiftDetails}>
                <Text style={globalStyles.shiftArea}>{ev.title}</Text>
                <Text style={globalStyles.shiftContact}>{ev.date} {ev.startTime ? '• ' + ev.startTime : ''}</Text>
                {ev.location ? <Text style={globalStyles.shiftEmployees}>{ev.location}</Text> : null}
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ marginTop: 12 }}>
          <TouchableOpacity style={globalStyles.formButtonPrimary} onPress={() => navigation.navigate('CreateEvent', { companyCode })}>
            <Text style={globalStyles.formButtonText}>Opret event</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Economy tab content
  const renderEconomy = () => {
    const metrics = calculateMetrics();
    
    return (
      <View style={globalStyles.contentContainer}>
        <Text style={globalStyles.sectionTitle}>Økonomisk Overblik</Text>
        
        <View style={globalStyles.statsGrid}>
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>N/A</Text>
            <Text style={globalStyles.statLabel}>Estimeret lønudgift</Text>
          </View>
          
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>N/A</Text>
            <Text style={globalStyles.statLabel}>Samlede udgifter</Text>
          </View>
          
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>N/A</Text>
            <Text style={globalStyles.statLabel}>Samlede indtægter</Text>
          </View>
          
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>N/A</Text>
            <Text style={globalStyles.statLabel}>Foreløbigt resultat</Text>
          </View>
          
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>N/A</Text>
            <Text style={globalStyles.statLabel}>Løn % af udgifter</Text>
          </View>
          
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>N/A</Text>
            <Text style={globalStyles.statLabel}>Udgift pr. arbejdstime</Text>
          </View>
        </View>
      </View>
    );
  };

  // Staff tab content  
  const renderStaff = () => {
    const metrics = calculateMetrics();
    
    return (
      <View style={globalStyles.contentContainer}>
        <Text style={globalStyles.sectionTitle}>Personal Statistikker</Text>
        
        <View style={globalStyles.statsGrid}>
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>{metrics.totalEmployees}</Text>
            <Text style={globalStyles.statLabel}>Aktive medarbejdere</Text>
          </View>
          
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>{Math.round(metrics.avgHoursPerEmployee) || 0}h</Text>
            <Text style={globalStyles.statLabel}>Gns. timer pr. medarbejder</Text>
          </View>
          
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>N/A</Text>
            <Text style={globalStyles.statLabel}>Fremmødeprocent</Text>
          </View>
          
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>N/A</Text>
            <Text style={globalStyles.statLabel}>Afbudsrate</Text>
          </View>
          
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>N/A</Text>
            <Text style={globalStyles.statLabel}>CrewScore</Text>
          </View>
        </View>
        
        <View style={globalStyles.top3Container}>
          <Text style={globalStyles.subsectionTitle}>Top 3 Medarbejdere (baseret på fremmøde)</Text>
          <View style={globalStyles.employeeBadge}>
            <Text style={globalStyles.employeeName}>Data ikke tilgængelig endnu</Text>
            <Text style={globalStyles.employeeStats}>N/A</Text>
          </View>
          <Text style={globalStyles.naText}>
            Kommer når fremmødedata er implementeret
          </Text>
        </View>
      </View>
    );
  };

  // Efficiency tab content
  const renderEfficiency = () => {
    const metrics = calculateMetrics();
    
    return (
      <View style={globalStyles.contentContainer}>
        <Text style={globalStyles.sectionTitle}>Effektivitet & Performance</Text>
        
        <View style={globalStyles.statsGrid}>
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>N/A</Text>
            <Text style={globalStyles.statLabel}>Aktive vagter i gang</Text>
          </View>
          
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>{metrics.totalWorkHours}h</Text>
            <Text style={globalStyles.statLabel}>Samlede arbejdstimer</Text>
          </View>
          
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>N/A</Text>
            <Text style={globalStyles.statLabel}>Fremmødeprocent</Text>
          </View>
          
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>N/A</Text>
            <Text style={globalStyles.statLabel}>Udførte vagter</Text>
          </View>
          
          <View style={globalStyles.statCard}>
            <Text style={globalStyles.statNumber}>N/A</Text>
            <Text style={globalStyles.statLabel}>Event Status Score</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render current tab content
  const renderCurrentTab = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "events":
        return renderEvents();
      case "economy":
        return renderEconomy();
      case "staff":
        return renderStaff();
      case "efficiency":
        return renderEfficiency();
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
      
      <View style={globalStyles.tabContent}>
        {renderCurrentTab()}
      </View>
    </SafeAreaView>
  );
}
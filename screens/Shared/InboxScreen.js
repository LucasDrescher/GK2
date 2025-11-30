import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { rtdb } from '../../database/firebase';
import { ref, onValue, push, update } from 'firebase/database';
import { globalStyles, colors } from '../../styles';

export default function InboxScreen({ route, navigation }) {
  const { companyCode, userId, userRole } = route.params || {};
  const [chats, setChats] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [employees, setEmployees] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [chatType, setChatType] = useState('general'); // 'general' eller 'event'
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (!companyCode) return;

    // Lyt til alle chats
    const chatsRef = ref(rtdb, `companies/${companyCode}/chats`);
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const chatList = Object.entries(data)
        .map(([id, chat]) => ({ id, ...chat }))
        .filter(chat => {
          // Vis kun chats hvor brugeren er medlem
          return chat.members && chat.members[userId];
        })
        .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
      
      setChats(chatList);
    });

    return () => unsubscribe();
  }, [companyCode, userId]);

  // Hent medarbejdere for at oprette chats
  useEffect(() => {
    if (!companyCode) return;

    const employeesRef = ref(rtdb, `companies/${companyCode}/employees`);
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const empList = Object.entries(data)
        .filter(([id, emp]) => emp.role === 'employee' && emp.approved === true)
        .map(([id, emp]) => ({ id, ...emp }));
      setEmployees(empList);
    });

    return () => unsubscribe();
  }, [companyCode]);

  // Hent events for at oprette event chats
  useEffect(() => {
    if (!companyCode) return;

    const eventsRef = ref(rtdb, `companies/${companyCode}/events`);
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const eventList = Object.entries(data)
        .map(([id, event]) => ({ id, ...event }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setEvents(eventList);
    });

    return () => unsubscribe();
  }, [companyCode]);

  const handleCreateGeneralChat = async () => {
    if (!newChatName.trim()) {
      Alert.alert('Validering', 'Indtast et navn til chatten');
      return;
    }

    if (chatType === 'general' && selectedMembers.length === 0) {
      Alert.alert('Validering', 'Vælg mindst én medarbejder');
      return;
    }

    if (chatType === 'event' && !selectedEvent) {
      Alert.alert('Validering', 'Vælg et event');
      return;
    }

    try {
      const members = {};
      
      // Tilføj admin
      if (userRole === 'admin') {
        members[userId] = {
          role: 'admin',
          joinedAt: Date.now(),
        };
      }

      if (chatType === 'event') {
        // Tilføj medarbejdere fra det valgte event
        if (selectedEvent.assignedEmployees) {
          Object.entries(selectedEvent.assignedEmployees).forEach(([empId, empData]) => {
            members[empId] = {
              role: 'employee',
              firstName: empData.firstName,
              lastName: empData.lastName,
              joinedAt: Date.now(),
            };
          });
        }
      } else {
        // Tilføj manuelt valgte medarbejdere
        selectedMembers.forEach(empId => {
          const emp = employees.find(e => e.id === empId);
          if (emp) {
            members[empId] = {
              role: 'employee',
              firstName: emp.firstName,
              lastName: emp.lastName,
              joinedAt: Date.now(),
            };
          }
        });
      }

      const chatData = {
        name: newChatName.trim(),
        type: chatType,
        createdBy: userId,
        createdAt: Date.now(),
        lastMessageTime: Date.now(),
        members: members,
        messageCount: 0,
      };

      // Hvis det er en event chat, tilføj event information
      if (chatType === 'event' && selectedEvent) {
        chatData.eventId = selectedEvent.id;
        chatData.eventData = {
          title: selectedEvent.title,
          date: selectedEvent.date,
          startTime: selectedEvent.startTime,
          endTime: selectedEvent.endTime,
          location: selectedEvent.location,
        };
      }

      await push(ref(rtdb, `companies/${companyCode}/chats`), chatData);
      
      setShowCreateModal(false);
      setNewChatName('');
      setSelectedMembers([]);
      setSelectedEvent(null);
      setChatType('general');
      Alert.alert('Succes', 'Gruppechat oprettet');
    } catch (error) {
      Alert.alert('Fejl', 'Kunne ikke oprette chat: ' + error.message);
    }
  };

  const toggleMemberSelection = (empId) => {
    setSelectedMembers(prev => 
      prev.includes(empId) 
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Lige nu';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}t`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
  };

  const renderChatItem = ({ item }) => {
    const memberCount = item.members ? Object.keys(item.members).length : 0;
    const hasUnread = item.unreadCount && item.unreadCount[userId] > 0;

    return (
      <TouchableOpacity
        style={{
          backgroundColor: colors.surface,
          marginHorizontal: 16,
          marginVertical: 6,
          padding: 16,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          borderLeftWidth: 4,
          borderLeftColor: item.type === 'event' ? '#4CAF50' : colors.primary,
        }}
        onPress={() => navigation.navigate('ChatRoom', {
          chatId: item.id,
          chatName: item.name,
          companyCode,
          userId,
          userRole
        })}
      >
        <View style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: item.type === 'event' ? '#E8F5E9' : colors.primaryLight,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          <Ionicons 
            name={item.type === 'event' ? 'calendar' : 'people'} 
            size={24} 
            color={item.type === 'event' ? '#4CAF50' : colors.primary} 
          />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: colors.text,
              flex: 1,
            }} numberOfLines={1}>
              {item.name}
            </Text>
            {item.lastMessageTime && (
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 8 }}>
                {formatLastMessageTime(item.lastMessageTime)}
              </Text>
            )}
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              {item.lastMessage || 'Ingen beskeder endnu'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 4 }}>
              {memberCount} medlemmer
            </Text>
            {item.type === 'event' && (
              <>
                <Text style={{ marginHorizontal: 8, color: colors.textSecondary }}>•</Text>
                <Text style={{ fontSize: 12, color: '#4CAF50', fontWeight: '600' }}>
                  Event chat
                </Text>
              </>
            )}
          </View>
        </View>

        {hasUnread && (
          <View style={{
            backgroundColor: colors.error,
            borderRadius: 12,
            minWidth: 24,
            height: 24,
            paddingHorizontal: 6,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 8,
          }}>
            <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700' }}>
              {item.unreadCount[userId]}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 60,
          paddingBottom: 32,
          paddingHorizontal: 16,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ 
            fontSize: 32, 
            fontWeight: '800', 
            color: colors.white,
            marginBottom: 4,
          }}>
            Indbakke
          </Text>
          <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
            {chats.length} {chats.length === 1 ? 'samtale' : 'samtaler'}
          </Text>
        </View>
        {userRole === 'admin' && (
          <TouchableOpacity
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(255,255,255,0.3)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={28} color={colors.white} />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Chat liste */}
      {chats.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.gray100,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textMuted }}>
            Ingen beskeder endnu
          </Text>
          {userRole === 'admin' && (
            <Text style={{ marginTop: 8, fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
              Tryk på + for at oprette en gruppechat
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}

        {/* Opret chat modal (kun admin) */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}>
            <View style={{
              backgroundColor: colors.white,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '85%',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
                  Opret chat
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowCreateModal(false);
                  setNewChatName('');
                  setSelectedMembers([]);
                  setSelectedEvent(null);
                  setChatType('general');
                }}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Chat type vælger */}
              <View style={{ flexDirection: 'row', marginBottom: 20, gap: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: chatType === 'general' ? colors.primary : colors.border,
                    backgroundColor: chatType === 'general' ? colors.primaryLight : colors.white,
                  }}
                  onPress={() => {
                    setChatType('general');
                    setSelectedEvent(null);
                  }}
                >
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="people" size={24} color={chatType === 'general' ? colors.primary : colors.textSecondary} />
                    <Text style={{ 
                      marginTop: 4, 
                      fontSize: 14, 
                      fontWeight: chatType === 'general' ? '700' : '500',
                      color: chatType === 'general' ? colors.primary : colors.textSecondary 
                    }}>
                      Generel chat
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: chatType === 'event' ? '#4CAF50' : colors.border,
                    backgroundColor: chatType === 'event' ? '#E8F5E9' : colors.white,
                  }}
                  onPress={() => {
                    setChatType('event');
                    setSelectedMembers([]);
                  }}
                >
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="calendar" size={24} color={chatType === 'event' ? '#4CAF50' : colors.textSecondary} />
                    <Text style={{ 
                      marginTop: 4, 
                      fontSize: 14, 
                      fontWeight: chatType === 'event' ? '700' : '500',
                      color: chatType === 'event' ? '#4CAF50' : colors.textSecondary 
                    }}>
                      Event chat
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>
                Chat navn
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  marginBottom: 20,
                }}
                placeholder={chatType === 'event' ? "Vælg et event nedenfor" : "F.eks. Alle medarbejdere"}
                value={newChatName}
                onChangeText={setNewChatName}
              />

              {/* Event vælger */}
              {chatType === 'event' && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>
                    Vælg event
                  </Text>
                  <ScrollView style={{ maxHeight: 200 }}>
                    {events.map(event => {
                      const isSelected = selectedEvent?.id === event.id;
                      const hasAssignedEmployees = event.assignedEmployees && Object.keys(event.assignedEmployees).length > 0;
                      
                      return (
                        <TouchableOpacity
                          key={event.id}
                          disabled={!hasAssignedEmployees}
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: isSelected ? '#4CAF50' : colors.border,
                            backgroundColor: isSelected ? '#E8F5E9' : hasAssignedEmployees ? colors.white : '#F5F5F5',
                            marginBottom: 8,
                            opacity: hasAssignedEmployees ? 1 : 0.5,
                          }}
                          onPress={() => {
                            setSelectedEvent(event);
                            setNewChatName(event.title);
                          }}
                        >
                          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                            {event.title}
                          </Text>
                          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                            {event.date} • {event.startTime} - {event.endTime}
                          </Text>
                          {event.location && (
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                              📍 {event.location}
                            </Text>
                          )}
                          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                            👥 {hasAssignedEmployees ? Object.keys(event.assignedEmployees).length : 0} tilknyttede medarbejdere
                          </Text>
                          {!hasAssignedEmployees && (
                            <Text style={{ fontSize: 11, color: colors.error, marginTop: 4 }}>
                              Ingen tilknyttede medarbejdere
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Medarbejder vælger (kun for generel chat) */}
              {chatType === 'general' && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>
                    Vælg medarbejdere ({selectedMembers.length} valgt)
                  </Text>
                  <ScrollView style={{ maxHeight: 250 }}>
                    {employees.map(emp => {
                      const isSelected = selectedMembers.includes(emp.id);
                      return (
                        <TouchableOpacity
                          key={emp.id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 12,
                            borderRadius: 8,
                            backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                            marginBottom: 8,
                          }}
                          onPress={() => toggleMemberSelection(emp.id)}
                        >
                          <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: isSelected ? colors.primary : colors.border,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 12,
                          }}>
                            {isSelected ? (
                              <Ionicons name="checkmark" size={24} color={colors.white} />
                            ) : (
                              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textSecondary }}>
                                {emp.firstName?.[0]}{emp.lastName?.[0]}
                              </Text>
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                              {emp.firstName} {emp.lastName}
                            </Text>
                            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                              {emp.email}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  padding: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={handleCreateGeneralChat}
              >
                <Text style={{ color: colors.white, fontSize: 16, fontWeight: '700' }}>
                  Opret chat
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
    </View>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { rtdb } from '../../database/firebase';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { globalStyles, colors } from '../../styles';

export default function ChatRoomScreen({ route, navigation }) {
  const { chatId, chatName, companyCode, userId, userRole } = route.params;
  
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [chatData, setChatData] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const flatListRef = useRef(null);

  // Hent brugerens navn
  useEffect(() => {
    if (!companyCode || !userId) return;

    const userPath = userRole === 'admin' 
      ? `companies/${companyCode}/admins/${userId}`
      : `companies/${companyCode}/employees/${userId}`;
    
    const userRef = ref(rtdb, userPath);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentUserName(`${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Anonym');
      }
    });

    return () => unsubscribe();
  }, [companyCode, userId, userRole]);

  // Hent chat data (for event information)
  useEffect(() => {
    if (!companyCode || !chatId) return;

    const chatRef = ref(rtdb, `companies/${companyCode}/chats/${chatId}`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setChatData(data);
      }
    });

    return () => unsubscribe();
  }, [companyCode, chatId]);

  // Hent alle medarbejdere (for at kunne tilføje til chat)
  useEffect(() => {
    if (!companyCode || chatData?.type === 'event') return; // Event chats kan ikke redigeres

    const employeesRef = ref(rtdb, `companies/${companyCode}/employees`);
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const empList = Object.entries(data)
        .filter(([id, emp]) => emp.role === 'employee' && emp.approved === true)
        .map(([id, emp]) => ({ id, ...emp }));
      setAllEmployees(empList);
    });

    return () => unsubscribe();
  }, [companyCode, chatData]);

  // Lyt til beskeder
  useEffect(() => {
    if (!companyCode || !chatId) return;

    const messagesRef = ref(rtdb, `companies/${companyCode}/chats/${chatId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const messageList = Object.entries(data)
        .map(([id, msg]) => ({ id, ...msg }))
        .sort((a, b) => a.timestamp - b.timestamp);
      
      setMessages(messageList);

      // Marker som læst
      if (messageList.length > 0) {
        update(ref(rtdb, `companies/${companyCode}/chats/${chatId}/unreadCount`), {
          [userId]: 0
        });
      }

      // Scroll til bunden når nye beskeder kommer
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, [companyCode, chatId, userId]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      const message = {
        text: messageText.trim(),
        senderId: userId,
        senderName: currentUserName,
        senderRole: userRole,
        timestamp: Date.now(),
      };

      const messagesRef = ref(rtdb, `companies/${companyCode}/chats/${chatId}/messages`);
      await push(messagesRef, message);

      // Opdater unread count for alle medlemmer undtagen afsenderen
      if (chatData?.members) {
        const unreadUpdates = {};
        Object.keys(chatData.members).forEach(memberId => {
          if (memberId !== userId) {
            // Increment unread count for other members
            const currentUnread = chatData.unreadCount?.[memberId] || 0;
            unreadUpdates[memberId] = currentUnread + 1;
          }
        });
        
        if (Object.keys(unreadUpdates).length > 0) {
          await update(ref(rtdb, `companies/${companyCode}/chats/${chatId}/unreadCount`), unreadUpdates);
        }
      }

      // Opdater chat metadata
      await update(ref(rtdb, `companies/${companyCode}/chats/${chatId}`), {
        lastMessage: messageText.trim().substring(0, 50),
        lastMessageTime: Date.now(),
        messageCount: messages.length + 1,
      });

      setMessageText('');
    } catch (error) {
      console.error('Fejl ved afsendelse af besked:', error);
    }
  };

  const handleAddMember = async (empId) => {
    try {
      const emp = allEmployees.find(e => e.id === empId);
      if (!emp) return;

      const memberData = {
        role: 'employee',
        firstName: emp.firstName,
        lastName: emp.lastName,
        joinedAt: Date.now(),
      };

      await update(ref(rtdb, `companies/${companyCode}/chats/${chatId}/members/${empId}`), memberData);
      
      // Reset unread count for new member
      await update(ref(rtdb, `companies/${companyCode}/chats/${chatId}/unreadCount`), {
        [empId]: 0
      });

      Alert.alert('Succes', `${emp.firstName} ${emp.lastName} er tilføjet til chatten`);
    } catch (error) {
      Alert.alert('Fejl', 'Kunne ikke tilføje medlem: ' + error.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (memberId === userId) {
      Alert.alert('Fejl', 'Du kan ikke fjerne dig selv fra chatten');
      return;
    }

    const member = chatData?.members?.[memberId];
    if (!member) return;

    Alert.alert(
      'Fjern medlem',
      `Er du sikker på du vil fjerne ${member.firstName} ${member.lastName} fra chatten?`,
      [
        { text: 'Annuller', style: 'cancel' },
        {
          text: 'Fjern',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(ref(rtdb, `companies/${companyCode}/chats/${chatId}/members/${memberId}`));
              await remove(ref(rtdb, `companies/${companyCode}/chats/${chatId}/unreadCount/${memberId}`));
              Alert.alert('Succes', 'Medlem fjernet fra chatten');
            } catch (error) {
              Alert.alert('Fejl', 'Kunne ikke fjerne medlem: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / 86400000);

    if (diffDays === 0) {
      return date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'I går ' + date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) + ' ' + 
             date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.senderId === userId;
    const showSenderName = !isOwnMessage && (index === 0 || messages[index - 1].senderId !== item.senderId);

    return (
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 4,
        alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
      }}>
        {showSenderName && (
          <Text style={{
            fontSize: 12,
            color: colors.textSecondary,
            marginBottom: 4,
            marginLeft: isOwnMessage ? 0 : 12,
          }}>
            {item.senderName}
          </Text>
        )}
        
        <View style={{
          maxWidth: '75%',
          backgroundColor: isOwnMessage ? colors.primary : colors.gray200,
          borderRadius: 16,
          padding: 12,
          borderBottomRightRadius: isOwnMessage ? 4 : 16,
          borderBottomLeftRadius: isOwnMessage ? 16 : 4,
        }}>
          <Text style={{
            fontSize: 15,
            color: isOwnMessage ? colors.white : colors.text,
          }}>
            {item.text}
          </Text>
          <Text style={{
            fontSize: 11,
            color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.textMuted,
            marginTop: 4,
            alignSelf: 'flex-end',
          }}>
            {formatMessageTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={{
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
          }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginRight: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                {chatName}
              </Text>
              {chatData?.type === 'event' && (
                <Text style={{ fontSize: 13, color: '#4CAF50', marginTop: 2 }}>
                  Event chat
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setShowMembersModal(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primaryLight,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="information-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Event information */}
          {chatData?.type === 'event' && chatData?.eventData && (
            <View style={{
              backgroundColor: '#E8F5E9',
              borderLeftWidth: 4,
              borderLeftColor: '#4CAF50',
              padding: 12,
              marginHorizontal: 16,
              marginBottom: 12,
              borderRadius: 8,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Ionicons name="calendar" size={16} color="#2E7D32" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1B5E20', marginLeft: 6 }}>
                  Event Information
                </Text>
              </View>
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="time-outline" size={14} color="#2E7D32" />
                  <Text style={{ fontSize: 13, color: '#2E7D32', marginLeft: 6 }}>
                    {chatData.eventData.date} • {chatData.eventData.startTime} - {chatData.eventData.endTime}
                  </Text>
                </View>
                {chatData.eventData.location && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="location-outline" size={14} color="#2E7D32" />
                    <Text style={{ fontSize: 13, color: '#2E7D32', marginLeft: 6 }}>
                      {chatData.eventData.location}
                    </Text>
                  </View>
                )}
                {chatData.members && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="people-outline" size={14} color="#2E7D32" />
                    <Text style={{ fontSize: 13, color: '#2E7D32', marginLeft: 6 }}>
                      {Object.keys(chatData.members).length} deltagere
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Beskeder */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
              <Ionicons name="chatbubble-outline" size={48} color={colors.textMuted} />
              <Text style={{ marginTop: 16, fontSize: 16, color: colors.textSecondary, textAlign: 'center' }}>
                Ingen beskeder endnu
              </Text>
              <Text style={{ marginTop: 8, fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>
                Send den første besked!
              </Text>
            </View>
          )}
        />

        {/* Input felt */}
        <View style={{
          flexDirection: 'row',
          padding: 12,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          alignItems: 'center',
        }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: colors.background,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 16,
              marginRight: 8,
              maxHeight: 100,
            }}
            placeholder="Skriv en besked..."
            placeholderTextColor={colors.textMuted}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: messageText.trim() ? colors.primary : colors.gray300,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Ionicons name="send" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Members Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMembersModal(false)}
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
            maxHeight: '80%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
                Chat information
              </Text>
              <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Chat name */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
                  Chat navn
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                  {chatName}
                </Text>
              </View>

              {/* Chat type */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
                  Type
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons 
                    name={chatData?.type === 'event' ? 'calendar' : 'people'} 
                    size={18} 
                    color={chatData?.type === 'event' ? '#4CAF50' : colors.primary} 
                  />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: 8 }}>
                    {chatData?.type === 'event' ? 'Event chat' : 'Generel chat'}
                  </Text>
                </View>
              </View>

              {/* Members list */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>
                  Medlemmer ({chatData?.members ? Object.keys(chatData.members).length : 0})
                </Text>
                {chatData?.members && Object.entries(chatData.members).map(([memberId, member]) => {
                  const isCreator = chatData.createdBy === memberId;
                  const canRemove = chatData.createdBy === userId && chatData.type !== 'event' && memberId !== userId;

                  return (
                    <View
                      key={memberId}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 12,
                        borderRadius: 8,
                        backgroundColor: colors.surface,
                        marginBottom: 8,
                      }}
                    >
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.primaryLight,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                            {member.firstName} {member.lastName}
                          </Text>
                          {memberId === userId && (
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 8 }}>
                              (dig)
                            </Text>
                          )}
                          {isCreator && (
                            <View style={{
                              backgroundColor: colors.primaryLight,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 12,
                              marginLeft: 8,
                            }}>
                              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>
                                Oprettet
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                          {member.role === 'admin' ? 'Administrator' : 'Medarbejder'}
                        </Text>
                      </View>
                      {canRemove && (
                        <TouchableOpacity
                          onPress={() => handleRemoveMember(memberId)}
                          style={{
                            padding: 8,
                            borderRadius: 8,
                            backgroundColor: colors.errorLight || '#FFEBEE',
                          }}
                        >
                          <Ionicons name="person-remove" size={20} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Add members (only for creator of general chats) */}
              {chatData?.createdBy === userId && chatData?.type !== 'event' && (
                <View>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>
                    Tilføj medlemmer
                  </Text>
                  {allEmployees
                    .filter(emp => !chatData?.members?.[emp.id])
                    .map(emp => (
                      <TouchableOpacity
                        key={emp.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 12,
                          borderRadius: 8,
                          backgroundColor: colors.surface,
                          marginBottom: 8,
                        }}
                        onPress={() => handleAddMember(emp.id)}
                      >
                        <View style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: colors.border,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12,
                        }}>
                          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textSecondary }}>
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                            {emp.firstName} {emp.lastName}
                          </Text>
                          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                            {emp.email}
                          </Text>
                        </View>
                        <Ionicons name="add-circle" size={24} color={colors.primary} />
                      </TouchableOpacity>
                    ))}
                  {allEmployees.filter(emp => !chatData?.members?.[emp.id]).length === 0 && (
                    <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', padding: 20 }}>
                      Alle medarbejdere er allerede medlemmer
                    </Text>
                  )}
                </View>
              )}

              {chatData?.type === 'event' && (
                <View style={{
                  backgroundColor: '#FFF3E0',
                  padding: 12,
                  borderRadius: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: '#FF9800',
                  marginTop: 12,
                }}>
                  <Text style={{ fontSize: 13, color: '#E65100' }}>
                    Event chats kan ikke redigeres. Medlemmer opdateres automatisk når event-deltagere ændres.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

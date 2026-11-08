import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { color } from '@/theme/tokens';
import { useRecovery } from '@/context/recovery-context';
import { VigilBackground } from '@/components/vigil-background';
import { AIService, ChatMessage } from '@/services/ai-service';

export default function CompanionScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const isUrgeContext = params.mode === 'urge';

  const { cleanDays, userName, activeRank } = useRecovery();
  const scrollViewRef = useRef<any>(null);

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: isUrgeContext
        ? `Brother, I see you are in the eye of the storm right now. Breathe deeply. "Submit yourselves to God. Resist the devil, and he will flee from you" (James 4:7). Put your phone across the room, take 5 slow breaths, and tell me: what trigger or urge is pressing on your mind?`
        : `Peace be with you, ${userName || 'brother'}. I am Barnabas, your brother on the Knight's Path. Whether you need mid-urge grounding, Scripture armor, or honest prayer, I am standing with you. How can I walk with you right now?`,
      timestamp: 'Just now',
    },
  ]);

  const quickPrompts = [
    'Urge is hitting hard right now',
    'I slipped and feel ashamed',
    'Strengthen my heart with Scripture',
    'Why is dopamine recalibration so difficult?',
  ];

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isThinking]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isThinking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const reply = await AIService.sendMessage(text, messages, {
        userName,
        cleanDays,
        rankTitle: activeRank.title,
        isUrgeContext,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.warn('Companion chat error:', err);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <VigilBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <View style={styles.avatarCircle}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#F4F7FD" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6z" />
                </Svg>
              </View>
              <View>
                <Text style={styles.headerTitle}>Barnabas</Text>
                <Text style={styles.headerSubtitle}>Spiritual Brother in Christ</Text>
              </View>
            </View>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Present</Text>
            </View>
          </View>

          {/* Messages Feed */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubbleWrapper,
                    isUser ? styles.userWrapper : styles.aiWrapper,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isUser ? styles.userBubble : styles.aiBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isUser ? styles.userText : styles.aiText,
                      ]}
                    >
                      {msg.content}
                    </Text>
                  </View>
                  <Text style={styles.timestampText}>{msg.timestamp}</Text>
                </View>
              );
            })}

            {isThinking && (
              <View style={[styles.messageBubbleWrapper, styles.aiWrapper]}>
                <View style={[styles.messageBubble, styles.aiBubble, styles.thinkingBubble]}>
                  <ActivityIndicator size="small" color={color.ink} />
                  <Text style={styles.thinkingText}>Barnabas is reflecting with Scripture...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Prompt Chips */}
          <View style={styles.quickPromptsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickPromptsScroll}
            >
              {quickPrompts.map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSend(prompt)}
                  style={styles.promptChip}
                >
                  <Text style={styles.promptChipText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Input Bar */}
          <View style={styles.inputBarContainer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Speak honestly to Barnabas..."
              placeholderTextColor={color.inkTertiary}
              style={styles.textInput}
              multiline
              maxLength={400}
            />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSend()}
              disabled={!input.trim() || isThinking}
              style={[
                styles.sendButton,
                (!input.trim() || isThinking) && styles.sendButtonDisabled,
              ]}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#F4F7FD" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M22 2L11 13" />
                <Path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </Svg>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </VigilBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: color.chip,
    borderWidth: 1,
    borderColor: color.borderSoft,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: color.goldDeep,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Geist-Medium',
    color: color.ink,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  messageBubbleWrapper: {
    maxWidth: '84%',
    gap: 4,
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  aiWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: color.ink,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(244,247,253,0.95)',
    borderWidth: 1,
    borderColor: color.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Geist',
    lineHeight: 22,
  },
  userText: {
    fontSize: 15,
    fontFamily: 'Geist',
    lineHeight: 22,
    color: color.onInk,
  },
  aiText: {
    fontSize: 15,
    fontFamily: 'Geist',
    lineHeight: 23,
    color: color.ink,
  },
  timestampText: {
    fontSize: 10,
    fontFamily: 'Geist',
    color: color.inkMuted,
    marginHorizontal: 4,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thinkingText: {
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    color: color.inkTertiary,
  },
  quickPromptsContainer: {
    paddingVertical: 6,
  },
  quickPromptsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  promptChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: color.chip,
    borderWidth: 1,
    borderColor: color.borderSoft,
  },
  promptChipText: {
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    color: color.inkSecondary,
  },
  inputBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: color.hairline,
    backgroundColor: 'rgba(244,247,253,0.85)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Geist',
    color: color.ink,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});

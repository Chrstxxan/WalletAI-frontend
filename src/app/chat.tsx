import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, IconButton, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { sendChatMessage, getChatHistory, clearChatHistory } from '@/services/api';
import { Colors } from '@/constants/colors';

type Message = { id: string; role: 'user' | 'assistant'; content: string };

function formatLine(line: string): string {
  const bulletMatch = line.match(/^\s*[-*]\s+(.*)/);
  return bulletMatch ? `• ${bulletMatch[1]}` : line;
}

function FormattedMessage({ content, textStyle }: { content: string; textStyle: any }) {
  const lines = content.split('\n');
  return (
    <>
      {lines.map((rawLine, lineIndex) => {
        const line = formatLine(rawLine);
        const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
        return (
          <Text key={lineIndex} style={textStyle}>
            {parts.map((part, partIndex) => {
              const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
              return boldMatch
                ? <Text key={partIndex} style={styles.bold}>{boldMatch[1]}</Text>
                : <Text key={partIndex}>{part}</Text>;
            })}
          </Text>
        );
      })}
    </>
  );
}

const GREETING: Message = {
  id: 'greeting',
  role: 'assistant',
  content: 'Oi, eu sou o Wally! Pode me perguntar sobre seus gastos, tipo "quanto gastei com alimentação esse mês?" ou "como estão minhas finanças?".',
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const listRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await getChatHistory();
        if (history.length > 0) {
          setMessages(history.map((m: any) => ({ id: String(m.id), role: m.role, content: m.content })));
        }
      } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, []);

  async function handleSend() {
    if (!input.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const data = await sendChatMessage(userMessage.content);
      setMessages((prev) => [...prev, { id: Date.now().toString() + 'a', role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { id: Date.now().toString() + 'e', role: 'assistant', content: 'Não consegui responder agora. Verifique sua conexão e tente de novo.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  function confirmClear() {
    Alert.alert('Apagar conversa', 'Isso vai apagar todo o histórico do chat. Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: handleClear },
    ]);
  }

  async function handleClear() {
    try {
      await clearChatHistory();
      setMessages([GREETING]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível apagar o histórico');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <IconButton icon="chevron-left" iconColor={Colors.textPrimary} size={26} onPress={() => router.back()} style={styles.backButton} />
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>Wally</Text>
        <IconButton icon="trash-can-outline" iconColor={Colors.textSecondary} size={22} onPress={confirmClear} />
      </View>

      {loadingHistory ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              <FormattedMessage
                content={item.content}
                textStyle={item.role === 'user' ? styles.userText : styles.assistantText}
              />
            </View>
          )}
        />
      )}

      {loading && <ActivityIndicator color={Colors.primary} style={{ marginBottom: 8 }} />}

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Pergunte sobre seus gastos..."
          mode="flat"
          style={styles.input}
          underlineColor="transparent"
          textColor={Colors.textPrimary}
          onSubmitEditing={handleSend}
        />
        <IconButton icon="send" iconColor={Colors.primary} size={24} onPress={handleSend} disabled={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 12, paddingBottom: 8 },
  backButton: { margin: 0 },
  title: { color: Colors.textPrimary, fontWeight: '700', flex: 1, fontSize: 20 },
  messagesList: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  bubble: { maxWidth: '80%', padding: 14, borderRadius: 18 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: Colors.inputBackground, borderBottomLeftRadius: 4 },
  userText: { color: '#FFFFFF', fontSize: 15 },
  assistantText: { color: Colors.textPrimary, fontSize: 15 },
  bold: { fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 4 },
  input: { flex: 1, backgroundColor: Colors.inputBackground, borderRadius: 20 },
});
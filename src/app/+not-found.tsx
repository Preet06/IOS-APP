import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sanctuary', headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.icon}>🛡️</Text>
        <Text style={styles.title}>Stand Firm</Text>
        <Text style={styles.subtitle}>Returning you to your Sanctuary...</Text>

        <Link href="/home" asChild replace>
          <TouchableOpacity style={styles.homeBtn}>
            <Text style={styles.homeBtnText}>Return to Home →</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#070A12',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 24,
  },
  homeBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  homeBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
});


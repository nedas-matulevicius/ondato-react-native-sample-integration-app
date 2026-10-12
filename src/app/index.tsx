import {
  getLogs,
  startIdentification,
} from "ondato-sdk-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  InteractionManager,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ondatoAppearance, ondatoFonts } from "@/ondato/theme";

const DEFAULT_VERIFICATION_ID = "<Your generated IDV ID>";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export default function Index() {
  const [verificationId, setVerificationId] = useState(DEFAULT_VERIFICATION_ID);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState("Preparing Ondato SDK…");
  const didAutoStart = useRef(false);

  const launchOndato = useCallback(async () => {
    const identityVerificationId = verificationId.trim();

    if (!identityVerificationId || isRunning) {
      if (!identityVerificationId) {
        setMessage("Enter an identity verification ID first.");
      }
      return;
    }

    setIsRunning(true);
    setMessage("Ondato verification is in progress…");

    try {
      const result = await startIdentification({
        identityVerificationId,
        mode: "test",
        language: "en",
        logLevel: "debug",
        switchPrimaryButtons: false,
        enableNetworkIssuesScreen: true,
        disablePdfFileUpload: false,
        skipRegistrationIfDriverLicense: false,
        appearance: ondatoAppearance,
        fonts: ondatoFonts,
      });

      if (result.status === "success") {
        setMessage(`Verification completed${result.id ? ` (${result.id})` : ""}.`);
      } else {
        setMessage(`Verification stopped: ${result.error}.`);
      }
    } catch (error) {
      setMessage(`Unable to launch Ondato: ${getErrorMessage(error)}`);
    } finally {
      console.log("Ondato SDK logs:", getLogs());
      setIsRunning(false);
    }
  }, [isRunning, verificationId]);

  useEffect(() => {
    if (didAutoStart.current) {
      return;
    }

    didAutoStart.current = true;
    const task = InteractionManager.runAfterInteractions(() => {
      void launchOndato();
    });

    return () => task.cancel();
  }, [launchOndato]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>IDENTITY VERIFICATION</Text>
        <Text style={styles.title}>Ondato SDK</Text>
        <Text style={styles.description}>
          The verification flow opens automatically. Update the session ID and retry if needed.
        </Text>

        <Text style={styles.label}>Identity verification ID</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isRunning}
          onChangeText={setVerificationId}
          placeholder="Enter a verification ID"
          placeholderTextColor="#7A8190"
          selectTextOnFocus
          style={styles.input}
          value={verificationId}
        />

        <Pressable
          accessibilityRole="button"
          disabled={isRunning}
          onPress={() => void launchOndato()}
          style={({ pressed }) => [
            styles.button,
            isRunning && styles.buttonDisabled,
            pressed && !isRunning && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
            {isRunning ? "Verification running…" : "Launch Ondato"}
          </Text>
        </Pressable>

        <View style={styles.statusCard}>
          <View style={[styles.statusDot, isRunning && styles.statusDotRunning]} />
          <Text selectable style={styles.statusText}>
            {message}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  eyebrow: {
    color: "#64749C",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  title: {
    color: "#172033",
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  description: {
    color: "#566076",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  label: {
    color: "#2B3448",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#CBD1DC",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    color: "#172033",
    fontSize: 15,
    paddingHorizontal: 16,
  },
  button: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#64749C",
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    backgroundColor: "#E8ECF4",
    padding: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    backgroundColor: "#64749C",
  },
  statusDotRunning: {
    backgroundColor: "#E59A2F",
  },
  statusText: {
    flex: 1,
    color: "#414B60",
    fontSize: 14,
    lineHeight: 20,
  },
});

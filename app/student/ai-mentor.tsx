import React, { useRef, useState, useEffect } from "react";

import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
  Easing,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";

import { auth } from "../../firebase/firebaseConfig";

// =====================================================
// CONFIGURATION
// =====================================================

const API_URL = "https://projectverse-backend-3cwn.onrender.com";

const COLORS = {
  background: "#F5F7FB",
  introBackground: "#E8F8F4",
  primary: "#4338CA",
  purple: "#7C3AED",
  mint: "#38B2AC",
  mintDark: "#0D9488",
  mintLight: "#D5F5F2",
  white: "#FFFFFF",
  text: "#111827",
  secondary: "#6B7280",
  border: "#E5E7EB",
  userBubble: "#4338CA",
  leoBubble: "#FFFFFF",
  error: "#DC2626",
};

// =====================================================
// TYPES
// =====================================================

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type SelectedAttachment = {
  name: string;
  uri: string;
  mimeType: string;
  size?: number;
};

// =====================================================
// MAIN SCREEN
// =====================================================

export default function AIMentorScreen() {
  const navigation = useNavigation();

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const pendingMessageRef = useRef("");

  // ---------------------------------------------------
  // HIDE NAVIGATION HEADER
  // ---------------------------------------------------

  useEffect(() => {
    navigation.setOptions({ headerShown: false });

    return () => {
      navigation.setOptions({ headerShown: true });
    };
  }, [navigation]);

  // ---------------------------------------------------
  // LEO FLOATING ANIMATION
  // ---------------------------------------------------

  const floatAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [floatAnimation]);

  const mascotTranslateY = floatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  // ---------------------------------------------------
  // STATES
  // ---------------------------------------------------

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const [conversationId, setConversationId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);

  const [hasStarted, setHasStarted] = useState(false);

  const [selectedAttachment, setSelectedAttachment] =
    useState<SelectedAttachment | null>(null);

  // ---------------------------------------------------
  // CREATE CONVERSATION
  // ---------------------------------------------------

  const createConversation = async (signal: AbortSignal): Promise<string> => {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Please login again to continue.");
    }

    const token = await user.getIdToken();

    if (signal.aborted) {
      throw new axios.CanceledError("Request stopped");
    }

    const response = await axios.post(
      `${API_URL}/ai-mentor/conversations`,
      {
        title: "Leo AI Mentor",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
        signal,
      },
    );

    const newConversationId = response.data.conversationId;

    if (!newConversationId) {
      throw new Error("Unable to create a Leo conversation.");
    }

    if (!signal.aborted) {
      setConversationId(newConversationId);
    }

    return newConversationId;
  };

  // ---------------------------------------------------
  // FILE ATTACHMENT PICKER
  // ---------------------------------------------------

  const pickAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      const maxSize = 15 * 1024 * 1024;

      if (file.size && file.size > maxSize) {
        Alert.alert(
          "File too large",
          "Please select a file smaller than 15 MB.",
        );
        return;
      }

      setSelectedAttachment({
        name: file.name,
        uri: file.uri,
        mimeType: file.mimeType || "application/octet-stream",
        size: file.size,
      });
    } catch (error) {
      console.error("FILE PICKER ERROR:", error);

      Alert.alert("Unable to select file", "Please try again.");
    }
  };

  // ---------------------------------------------------
  // REMOVE ATTACHMENT
  // ---------------------------------------------------

  const removeAttachment = () => {
    setSelectedAttachment(null);
  };

  // ---------------------------------------------------
  // SEND MESSAGE TO LEO
  // ---------------------------------------------------

  const sendMessage = async () => {
    const messageText = input.trim();

    if (!messageText || loading) {
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Login Required", "Please login again to chat with Leo.");
      return;
    }

    // Current backend supports text messages only.
    if (selectedAttachment) {
      Alert.alert(
        "File upload integration pending",
        "Your file is selected, but Leo's backend does not yet support processing PDF and image attachments. You can still send a text message.",
      );
      return;
    }

    setInput("");
    setHasStarted(true);
    setLoading(true);

    const controller = new AbortController();

    requestControllerRef.current = controller;
    pendingMessageRef.current = messageText;

    try {
      const token = await user.getIdToken();

      if (controller.signal.aborted) return;

      let activeConversationId = conversationId;

      // Create a conversation for the first message.

      if (!activeConversationId) {
        setCreatingConversation(true);

        activeConversationId = await createConversation(controller.signal);

        setCreatingConversation(false);
      }

      if (controller.signal.aborted) return;

      // Send message to FastAPI backend.

      const response = await axios.post(
        `${API_URL}/ai-mentor/conversations/${activeConversationId}/messages`,
        {
          message: messageText,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 120000,
          signal: controller.signal,
        },
      );

      const returnedMessages: Message[] = response.data.messages;

      if (!returnedMessages || returnedMessages.length < 2) {
        throw new Error("Leo returned an unexpected response.");
      }

      setMessages((previous) => [...previous, ...returnedMessages]);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({
          animated: true,
        });
      }, 150);
    } catch (error: any) {
      if (controller.signal.aborted || axios.isCancel(error)) {
        return;
      }

      console.error("LEO CHAT ERROR:", error.response?.data || error.message);

      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Unable to connect to Leo. Please try again.";

      Alert.alert("Leo is unavailable", errorMessage);

      setInput(messageText);
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        pendingMessageRef.current = "";
        setLoading(false);
        setCreatingConversation(false);
      }
    }
  };

  // ---------------------------------------------------
  // STOP RESPONSE
  // ---------------------------------------------------

  const stopThinking = () => {
    const controller = requestControllerRef.current;

    if (!controller) return;

    const pendingMessage = pendingMessageRef.current;

    requestControllerRef.current = null;
    pendingMessageRef.current = "";

    controller.abort();

    setInput(pendingMessage);
    setLoading(false);
    setCreatingConversation(false);
  };

  // ---------------------------------------------------
  // START NEW CHAT
  // ---------------------------------------------------

  const handleNewChat = () => {
    if (loading) return;

    if (messages.length === 0 && !conversationId) {
      return;
    }

    Alert.alert(
      "Start a new conversation?",
      "Your current conversation will remain saved. You can start a fresh chat with Leo.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "New Chat",
          onPress: () => {
            setMessages([]);
            setConversationId(null);
            setInput("");
            setSelectedAttachment(null);
            setHasStarted(false);
          },
        },
      ],
    );
  };

  // ---------------------------------------------------
  // MESSAGE ITEM
  // ---------------------------------------------------

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";

    return (
      <View style={[styles.messageRow, isUser && styles.userMessageRow]}>
        {!isUser && (
          <Image
            source={require("../../assets/images/leo.png")}
            style={styles.messageAvatar}
            resizeMode="contain"
          />
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.leoBubble,
          ]}
        >
          {!isUser && <Text style={styles.messageSender}>Leo</Text>}

          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  // =====================================================
  // WELCOME / INTRO SCREEN
  // KEPT EXACTLY AS PROVIDED
  // =====================================================

  const renderWelcomeScreen = () => (
    <View style={styles.welcomeScreen}>
      {/* TOP LABEL */}

      <View style={styles.welcomeTop}>
        <View style={styles.brandLabel}>
          <Ionicons name="sparkles" size={15} color={COLORS.mintDark} />

          <Text style={styles.brandLabelText}>PROJECTVERSE AI MENTOR</Text>
        </View>

        <View style={styles.onlineContainer}>
          {/* <View style={styles.onlineDot} />

          <Text style={styles.onlineText}>
            Online
          </Text> */}
        </View>
      </View>

      {/* MAIN INTRO */}

      <View style={styles.welcomeCenter}>
        <Animated.View
          style={[
            styles.heroMascotContainer,
            {
              transform: [{ translateY: mascotTranslateY }],
            },
          ]}
        >
          <View style={styles.mascotGlow} />

          <Image
            source={require("../../assets/images/leo.png")}
            style={styles.heroMascot}
            resizeMode="contain"
          />
        </Animated.View>

        <Text style={styles.welcomeTitle}>Talk to Leo</Text>

        <Text style={styles.welcomeSubtitle}>
          Your ideas deserve a conversation.
        </Text>

        <Text style={styles.welcomeDescription}>
          Ask, explore, learn and create.
          {"\n"}
          I'm here to help you along the way.
        </Text>

        <View style={styles.welcomeStatus}>
          <View style={styles.statusSparkle}>
            <Ionicons name="sparkles" size={14} color={COLORS.mintDark} />
          </View>

          <Text style={styles.welcomeStatusText}>Ready when you are</Text>
        </View>
      </View>

      {/* BOTTOM BRANDING */}

      <View style={styles.welcomeFooter}>
        <Text style={styles.footerText}>
          Made for the ProjectVerse community
        </Text>
      </View>
    </View>
  );

  // =====================================================
  // CHAT SCREEN
  // =====================================================

  const renderChatScreen = () => (
    <View style={styles.chatContainer}>
      {/* CHAT TOP BAR */}

      <View style={styles.chatTopBar}>
        <View style={styles.chatTopInfo}>
          <Image
            source={require("../../assets/images/leo.png")}
            style={styles.chatHeaderMascot}
            resizeMode="contain"
          />

          <View>
            <Text style={styles.chatTopTitle}>Leo</Text>

            <View style={styles.chatSubtitleRow}>
              <View style={styles.chatOnlineDot} />

              <Text style={styles.chatSubtitle}>Your AI Mentor</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.newChatButton}
          onPress={handleNewChat}
          disabled={loading}
          activeOpacity={0.75}
        >
          <Ionicons name="create-outline" size={19} color={COLORS.primary} />

          <Text style={styles.newChatText}>New Chat</Text>
        </TouchableOpacity>
      </View>

      {/* MESSAGES */}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item.id || `${item.role}-${index}`}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Animated.View
              style={[
                styles.emptyChatMascotContainer,
                {
                  transform: [{ translateY: mascotTranslateY }],
                },
              ]}
            >
              <Image
                source={require("../../assets/images/leo.png")}
                style={styles.emptyChatMascot}
                resizeMode="contain"
              />
            </Animated.View>

            <Text style={styles.emptyChatText}>
              Let's get started! Ask me anything.
            </Text>
          </View>
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.typingRow}>
              <Image
                source={require("../../assets/images/leo.png")}
                style={styles.typingAvatar}
                resizeMode="contain"
              />

              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={COLORS.mint} />

                <Text style={styles.typingText}>
                  {creatingConversation
                    ? "Starting conversation..."
                    : "Leo is thinking..."}
                </Text>
              </View>
            </View>
          ) : null
        }
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({
            animated: true,
          })
        }
      />
    </View>
  );

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar
        backgroundColor={
          hasStarted ? COLORS.background : COLORS.introBackground
        }
        barStyle="dark-content"
      />

      <KeyboardAvoidingView
        style={styles.mainContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 5 : 0}
      >
        {!hasStarted ? renderWelcomeScreen() : renderChatScreen()}

        {/* MESSAGE COMPOSER */}

        <View
          style={[
            styles.composerContainer,
            !hasStarted && styles.welcomeComposerContainer,
          ]}
        >
          {/* SELECTED FILE PREVIEW */}

          {hasStarted && selectedAttachment && (
            <View style={styles.attachmentPreview}>
              <View style={styles.attachmentIcon}>
                <Ionicons
                  name={
                    selectedAttachment.mimeType === "application/pdf"
                      ? "document-text-outline"
                      : "image-outline"
                  }
                  size={23}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {selectedAttachment.name}
                </Text>

                <Text style={styles.attachmentType}>
                  {selectedAttachment.mimeType === "application/pdf"
                    ? "PDF Document"
                    : "Image"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={removeAttachment}
                style={styles.removeAttachmentButton}
                accessibilityLabel="Remove attachment"
              >
                <Ionicons
                  name="close-circle"
                  size={23}
                  color={COLORS.secondary}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* INPUT AREA */}

          <View style={styles.composer}>
            {/* ATTACHMENT BUTTON - CHAT ONLY */}

            {hasStarted && (
              <TouchableOpacity
                style={styles.attachButton}
                onPress={pickAttachment}
                disabled={loading}
                activeOpacity={0.7}
                accessibilityLabel="Attach PDF or image"
              >
                <Ionicons
                  name="attach-outline"
                  size={23}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            )}

            {/* TEXT INPUT */}

            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Ask Leo anything..."
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={5000}
              editable={!loading}
              returnKeyType="default"
              blurOnSubmit={false}
            />

            {/* SEND / STOP BUTTON */}

            <TouchableOpacity
              style={[
                styles.sendButton,
                loading
                  ? styles.stopButton
                  : !input.trim() &&
                    !selectedAttachment &&
                    styles.sendButtonDisabled,
              ]}
              onPress={() => {
                if (loading) {
                  stopThinking();
                  return;
                }

                if (selectedAttachment) {
                  Alert.alert(
                    "File upload integration pending",
                    "The file picker is ready, but the backend still needs an upload endpoint to process PDF and image attachments.",
                  );
                  return;
                }

                sendMessage();
              }}
              disabled={!loading && !input.trim() && !selectedAttachment}
              activeOpacity={0.8}
              accessibilityLabel={loading ? "Stop response" : "Send message"}
            >
              <Ionicons
                name={loading ? "stop" : "send"}
                size={loading ? 18 : 19}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.composerFooter}>
            Leo can make mistakes. Verify important information.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  mainContainer: {
    flex: 1,
  },

  // ---------------------------------------------------
  // WELCOME SCREEN - UNCHANGED
  // ---------------------------------------------------

  welcomeScreen: {
    flex: 1,
    backgroundColor: COLORS.introBackground,
    paddingHorizontal: 23,
    paddingTop: 12,
    paddingBottom: 12,
    justifyContent: "space-between",
  },

  welcomeTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brandLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 30,
  },

  brandLabelText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#267F79",
  },

  onlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },

  onlineText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#39877F",
  },

  welcomeCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
  },

  heroMascotContainer: {
    width: 190,
    height: 195,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  mascotGlow: {
    position: "absolute",
    width: 155,
    height: 155,
    borderRadius: 80,
    backgroundColor: "#D2F1E9",
    opacity: 0.85,
  },

  heroMascot: {
    width: 150,
    height: 175,
  },

  welcomeTitle: {
    fontSize: 31,
    fontWeight: "900",
    color: "#312E81",
    letterSpacing: -0.8,
    textAlign: "center",
  },

  welcomeSubtitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
    marginTop: 9,
    textAlign: "center",
  },

  welcomeDescription: {
    fontSize: 13,
    lineHeight: 21,
    color: "#64748B",
    marginTop: 13,
    textAlign: "center",
  },

  welcomeStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 24,
    gap: 7,
  },

  statusSparkle: {
    alignItems: "center",
    justifyContent: "center",
  },

  welcomeStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#318A83",
  },

  welcomeFooter: {
    alignItems: "center",
    paddingVertical: 7,
  },

  footerText: {
    fontSize: 10,
    color: "#82A9A2",
    fontWeight: "500",
  },

  // ---------------------------------------------------
  // CHAT SCREEN
  // ---------------------------------------------------

  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  chatTopBar: {
    minHeight: 62,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEDF2",
  },

  chatTopInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  chatHeaderMascot: {
    width: 43,
    height: 45,
  },

  chatTopTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },

  chatSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 5,
  },

  chatSubtitle: {
    fontSize: 10,
    color: COLORS.secondary,
  },

  chatOnlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },

  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: "#EEF0FF",
  },

  newChatText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },

  messageList: {
    paddingHorizontal: 15,
    paddingTop: 18,
    paddingBottom: 20,
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
  },

  userMessageRow: {
    justifyContent: "flex-end",
  },

  messageAvatar: {
    width: 32,
    height: 37,
    marginRight: 7,
  },

  messageBubble: {
    maxWidth: "83%",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 17,
  },

  leoBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: "#E9ECF2",
  },

  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 5,
  },

  messageSender: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.mint,
    marginBottom: 5,
  },

  messageText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.text,
  },

  userMessageText: {
    color: COLORS.white,
  },

  emptyChat: {
    paddingVertical: 20,
    alignItems: "center",
  },

  emptyChatMascotContainer: {
    width: 115,
    height: 115,
    borderRadius: 60,
    backgroundColor: "#D5F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyChatMascot: {
    width: 90,
    height: 95,
  },

  emptyChatText: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: "center",
  },
  // ---------------------------------------------------
  // TYPING INDICATOR
  // ---------------------------------------------------

  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 12,
  },

  typingAvatar: {
    width: 32,
    height: 37,
    marginRight: 7,
  },

  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 11,
    gap: 9,
    borderWidth: 1,
    borderColor: "#E9ECF2",
  },

  typingText: {
    fontSize: 11,
    color: COLORS.secondary,
  },

  // ---------------------------------------------------
  // COMPOSER
  // ---------------------------------------------------

  composerContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 5 : 9,
    borderTopWidth: 1,
    borderTopColor: "#EAEDF2",
  },

  welcomeComposerContainer: {
    backgroundColor: COLORS.introBackground,
    borderTopColor: "rgba(255,255,255,0.5)",
  },

  composer: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E5EAF0",
    borderRadius: 17,
    paddingLeft: 7,
    paddingRight: 6,
  },

  attachButton: {
    width: 38,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },

  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    fontSize: 13,
    color: COLORS.text,
    paddingTop: 10,
    paddingBottom: 10,
  },

  sendButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 7,
  },

  stopButton: {
    backgroundColor: COLORS.error,
  },

  sendButtonDisabled: {
    backgroundColor: "#AAA8DD",
  },

  composerFooter: {
    textAlign: "center",
    fontSize: 9,
    color: "#A0A7B3",
    marginTop: 7,
  },

  // ---------------------------------------------------
  // ATTACHMENT PREVIEW
  // ---------------------------------------------------

  attachmentPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4FF",
    borderWidth: 1,
    borderColor: "#E0E3FA",
    borderRadius: 13,
    padding: 10,
    marginBottom: 9,
  },

  attachmentIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  attachmentInfo: {
    flex: 1,
  },

  attachmentName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },

  attachmentType: {
    fontSize: 10,
    color: COLORS.secondary,
    marginTop: 4,
  },

  removeAttachmentButton: {
    padding: 5,
  },
});

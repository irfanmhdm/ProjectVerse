import React, { useRef, useState, useEffect } from "react";

import {
  View, Text, StyleSheet, Image, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar, Animated, Easing,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";
import Markdown from "react-native-markdown-display";
import { onAuthStateChanged } from "firebase/auth";

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

type Conversation = {
  id: string;
  title?: string;
  isPinned?: boolean;
  updatedAt?: any;
  createdAt?: any;
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
  const pendingMessageIdRef = useRef<string | null>(null);

  // HIDE NAVIGATION HEADER

  useEffect(() => {
    navigation.setOptions({ headerShown: false });

    return () => {
      navigation.setOptions({ headerShown: true });
    };
  }, [navigation]);

  // LEO FLOATING ANIMATION

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

  // STATES

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const [selectedAttachment, setSelectedAttachment] =
    useState<SelectedAttachment | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editingConversationId, setEditingConversationId] =
    useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // LOAD CHAT HISTORY

  const fetchConversations = async (user = auth.currentUser) => {
    if (!user) {
      setConversations([]);
      return;
    }

    setHistoryLoading(true);

    try {
      const token = await user.getIdToken();

      const response = await axios.get(
        `${API_URL}/ai-mentor/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        },
      );

      setConversations(
        (response.data?.conversations || []).sort(
          (a: Conversation, b: Conversation) =>
            Number(!!b.isPinned) - Number(!!a.isPinned),
        ),
      );
    } catch (error: any) {
      console.error(
        "LEO HISTORY ERROR:",
        error.response?.data || error.message,
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // RESTORE FIREBASE AUTH AND LOAD HISTORY

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchConversations(user);
      } else {
        setConversations([]);
        setMessages([]);
        setConversationId(null);
        setHasStarted(false);
        setHistoryVisible(false);
      }
    });

    return unsubscribe;
  }, []);

  // OPEN A SAVED CONVERSATION

  const openConversation = async (id: string) => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Login Required", "Please login again to view your chats.");
      return;
    }

    setHistoryLoading(true);

    try {
      const token = await user.getIdToken();

      const response = await axios.get(
        `${API_URL}/ai-mentor/conversations/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        },
      );

      const conversationData = response.data?.data ?? response.data;

      const savedMessages = Array.isArray(conversationData?.messages)
        ? conversationData.messages
        : [];

      setConversationId(id);

      setMessages(
        savedMessages.map((message: any, index: number) => ({
          id: message.id || `${message.role}-${index}`,
          role: message.role === "user" ? "user" : "assistant",
          content: message.content || "",
        })),
      );

      setInput("");
      setSelectedAttachment(null);
      setHasStarted(true);
      setHistoryVisible(false);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 250);
    } catch (error: any) {
      console.error(
        "OPEN LEO CONVERSATION ERROR:",
        error.response?.data || error.message,
      );

      Alert.alert(
        "Unable to open conversation",
        error.response?.data?.detail || error.message || "Please try again.",
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // GENERATE CONVERSATION TITLE

  const generateConversationTitle = (
    message: string,
    attachment?: SelectedAttachment | null,
  ): string => {
    const rawMessage = message.trim();

    if (!rawMessage && attachment) {
      const fileTitle = attachment.name.replace(/\.[^/.]+$/, "").trim();
      return (fileTitle || "File Discussion").slice(0, 60);
    }

    const normalized = rawMessage
      .replace(/[’']/g, "")
      .replace(/[^a-zA-Z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const lower = normalized.toLowerCase();

    if (
      /\bmca\b/.test(lower) &&
      /\b(project|projects)\b/.test(lower) &&
      /\b(suggest|suggestion|suggestions|idea|ideas|recommend)\b/.test(lower)
    ) {
      return "MCA Project Suggestions";
    }

    if (
      /\b(ai|artificial intelligence)\b/.test(lower) &&
      /\b(project|projects)\b/.test(lower) &&
      /\b(suggest|suggestion|suggestions|idea|ideas|recommend)\b/.test(lower)
    ) {
      return "AI Project Suggestions";
    }

    const stopWords = new Set([
      "a", "an", "the", "please", "can", "could", "would", "you",
      "me", "my", "i", "we", "our", "give", "suggest", "suggestion",
      "suggestions", "recommend", "recommendation", "recommendations",
      "tell", "show", "need", "want", "some", "any", "for", "of",
      "in", "on", "about", "to", "with", "using", "use", "based",
      "what", "which", "how", "is", "are", "it", "this", "that",
      "more", "details", "detail", "ideas", "idea", "project", "projects",
      "elaborate", "explain", "discuss", "features", "feature",
    ]);

    const words = normalized
      .split(" ")
      .filter((word) => !/^\d+$/.test(word))
      .filter((word) => !stopWords.has(word.toLowerCase()));

    const selectedWords = words.slice(0, 5);

    let title = selectedWords.length
      ? selectedWords
          .map((word) =>
            word.length <= 4
              ? word.toUpperCase()
              : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(" ")
      : normalized.split(" ").slice(0, 5).join(" ");

    if (!title) title = "New Conversation";
    return title.slice(0, 60);
  };

  // CREATE CONVERSATION

  const createConversation = async (
    signal: AbortSignal,
    title: string,
  ): Promise<string> => {
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
      { title },
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

  // FILE ATTACHMENT PICKER

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

  // REMOVE ATTACHMENT

  const removeAttachment = () => {
    setSelectedAttachment(null);
  };

  // SEND MESSAGE TO LEO

  const sendMessage = async () => {
    const messageText = input.trim();
    const attachment = selectedAttachment;

    if ((!messageText && !attachment) || loading) return;

    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Login Required", "Please login again to chat with Leo.");
      return;
    }

    // Display the user's message immediately.
    // Leo's reply is appended separately after the API responds.

    const optimisticMessageId = `user-${Date.now()}`;

    const optimisticUserMessage: Message = {
      id: optimisticMessageId,
      role: "user",
      content: messageText || `📎 ${attachment?.name || "Attachment"}`,
    };

    setMessages((previous) => [...previous, optimisticUserMessage]);
    setInput("");
    setHasStarted(true);
    setLoading(true);

    const controller = new AbortController();
    requestControllerRef.current = controller;
    pendingMessageRef.current = messageText;
    pendingMessageIdRef.current = optimisticMessageId;

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const token = await user.getIdToken();

      if (controller.signal.aborted) return;

      let activeConversationId = conversationId;

      if (!activeConversationId) {
        setCreatingConversation(true);

        const conversationTitle = generateConversationTitle(
          messageText,
          attachment,
        );

        activeConversationId = await createConversation(
          controller.signal,
          conversationTitle,
        );

        setCreatingConversation(false);
      }

      if (controller.signal.aborted) return;

      let response;

      if (attachment) {
        const formData = new FormData();

        formData.append("message", messageText);

        formData.append(
          "file",
          {
            uri: attachment.uri,
            name: attachment.name,
            type: attachment.mimeType,
          } as any,
        );

        response = await axios.post(
          `${API_URL}/ai-mentor/conversations/${activeConversationId}/messages-with-attachment`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            timeout: 120000,
            signal: controller.signal,
          },
        );
      } else {
        response = await axios.post(
          `${API_URL}/ai-mentor/conversations/${activeConversationId}/messages`,
          { message: messageText },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 120000,
            signal: controller.signal,
          },
        );
      }

      const returnedMessages: Message[] = response.data?.messages || [];

      const assistantMessages = returnedMessages
        .filter((message: any) => message?.role === "assistant")
        .map((message: any, index: number) => ({
          id: message.id || `assistant-${Date.now()}-${index}`,
          role: "assistant" as const,
          content: message.content || "",
        }))
        .filter((message: Message) => message.content.trim().length > 0);

      if (assistantMessages.length === 0) {
        throw new Error("Leo returned an unexpected response.");
      }

      // Append only Leo's response. Do not duplicate the user message.

      setMessages((previous) => [...previous, ...assistantMessages]);
      setSelectedAttachment(null);

      await fetchConversations(user);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    } catch (error: any) {
      setMessages((previous) =>
        previous.filter((message) => message.id !== optimisticMessageId),
      );

      if (controller.signal.aborted || axios.isCancel(error)) return;

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
        pendingMessageIdRef.current = null;
        setLoading(false);
        setCreatingConversation(false);
      }
    }
  };

  // RENAME CONVERSATION

  const saveConversationTitle = async (id: string) => {
    const title = editingTitle.trim();

    if (!title) {
      Alert.alert("Title required", "Enter a name for this conversation.");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    try {
      const token = await user.getIdToken();

      await axios.patch(
        `${API_URL}/ai-mentor/conversations/${id}/title`,
        { title },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        },
      );

      setConversations((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, title } : item,
        ),
      );

      setEditingConversationId(null);
      setEditingTitle("");
    } catch (error: any) {
      Alert.alert(
        "Rename failed",
        error.response?.data?.detail || "Could not rename this chat.",
      );
    }
  };

  // PIN / UNPIN CONVERSATION (MAXIMUM 10)

  const toggleConversationPin = async (item: Conversation) => {
    const user = auth.currentUser;
    if (!user) return;

    if (
      !item.isPinned &&
      conversations.filter((chat) => chat.isPinned).length >= 10
    ) {
      Alert.alert(
        "Pin limit reached",
        "You can pin a maximum of 10 conversations. Unpin another chat first.",
      );
      return;
    }

    try {
      const token = await user.getIdToken();

      const response = await axios.patch(
        `${API_URL}/ai-mentor/conversations/${item.id}/pin`,
        { isPinned: !item.isPinned },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        },
      );

      setConversations((previous) =>
        previous
          .map((chat) =>
            chat.id === item.id
              ? { ...chat, isPinned: response.data.isPinned }
              : chat,
          )
          .sort(
            (a, b) => Number(!!b.isPinned) - Number(!!a.isPinned),
          ),
      );
    } catch (error: any) {
      Alert.alert(
        "Pin update failed",
        error.response?.data?.detail || "Could not update pin status.",
      );
    }
  };

  // DELETE CONVERSATION

  const deleteConversation = (item: Conversation) => {
    Alert.alert(
      "Delete conversation?",
      `"${item.title || "Leo conversation"}" and all its messages will be permanently deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
              const token = await user.getIdToken();

              await axios.delete(
                `${API_URL}/ai-mentor/conversations/${item.id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                  timeout: 30000,
                },
              );

              setConversations((previous) =>
                previous.filter((chat) => chat.id !== item.id),
              );

              if (conversationId === item.id) {
                setConversationId(null);
                setMessages([]);
                setInput("");
                setSelectedAttachment(null);
                setHasStarted(false);
              }

              if (editingConversationId === item.id) {
                setEditingConversationId(null);
                setEditingTitle("");
              }
            } catch (error: any) {
              console.error(
                "DELETE CONVERSATION ERROR:",
                error.response?.data || error.message,
              );

              Alert.alert(
                "Delete failed",
                error.response?.data?.detail ||
                  "Could not delete this conversation.",
              );
            }
          },
        },
      ],
    );
  };

  // STOP RESPONSE

  const stopThinking = () => {
    const controller = requestControllerRef.current;

    if (!controller) return;

    const pendingMessage = pendingMessageRef.current;
    const pendingMessageId = pendingMessageIdRef.current;

    requestControllerRef.current = null;
    pendingMessageRef.current = "";
    pendingMessageIdRef.current = null;

    controller.abort();

    if (pendingMessageId) {
      setMessages((previous) =>
        previous.filter((message) => message.id !== pendingMessageId),
      );
    }

    setInput(pendingMessage);
    setLoading(false);
    setCreatingConversation(false);
  };

  // START NEW CHAT

  const handleNewChat = () => {
    if (loading) return;

    if (messages.length === 0 && !conversationId) return;

    Alert.alert(
      "Start a new conversation?",
      "Your current conversation will remain saved. You can start a fresh chat with Leo.",
      [
        { text: "Cancel", style: "cancel" },
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

  // MESSAGE ITEM

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

          {isUser ? (
            <Text style={[styles.messageText, styles.userMessageText]}>
              {item.content}
            </Text>
          ) : (
            <Markdown style={markdownStyles}>
              {item.content || ""}
            </Markdown>
          )}
        </View>
      </View>
    );
  };

  // =====================================================
  // WELCOME / INTRO SCREEN
  // =====================================================

  const renderWelcomeScreen = () => (
    <View style={styles.welcomeScreen}>
      <View style={styles.welcomeTop}>
        <View style={styles.brandLabel}>
          <Ionicons name="sparkles" size={15} color={COLORS.mintDark} />
          <Text style={styles.brandLabelText}>PROJECTVERSE AI MENTOR</Text>
        </View>

        <TouchableOpacity
          style={styles.welcomeHistoryButton}
          onPress={() => {
            setHistoryVisible(true);
            fetchConversations();
          }}
          activeOpacity={0.75}
        >
          <Ionicons name="time-outline" size={18} color={COLORS.primary} />
          <Text style={styles.welcomeHistoryText}>History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.welcomeCenter}>
        <Animated.View
          style={[
            styles.heroMascotContainer,
            { transform: [{ translateY: mascotTranslateY }] },
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

        <View style={styles.chatHeaderActions}>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => {
              setHistoryVisible(true);
              fetchConversations();
            }}
            activeOpacity={0.75}
            accessibilityLabel="Open chat history"
          >
            <Ionicons name="time-outline" size={19} color={COLORS.primary} />
          </TouchableOpacity>

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
                { transform: [{ translateY: mascotTranslateY }] },
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
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />
    </View>
  );

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
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

        {/* CHAT HISTORY DRAWER */}

        {historyVisible && (
          <View style={styles.historyOverlay}>
            <TouchableOpacity
              style={styles.historyBackdrop}
              activeOpacity={1}
              onPress={() => setHistoryVisible(false)}
            />

            <View style={styles.historyDrawer}>
              <View style={styles.historyDrawerHeader}>
                <View>
                  <Text style={styles.historyDrawerTitle}>Chat history</Text>

                  <Text style={styles.historyDrawerSubtitle}>
                    Your conversations with Leo
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.historyCloseButton}
                  onPress={() => setHistoryVisible(false)}
                  accessibilityLabel="Close chat history"
                >
                  <Ionicons name="close" size={22} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.historyNewChatButton}
                onPress={() => {
                  setHistoryVisible(false);

                  if (messages.length > 0 || conversationId) {
                    handleNewChat();
                  }
                }}
                disabled={loading}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={COLORS.white}
                />

                <Text style={styles.historyNewChatText}>
                  Start new chat
                </Text>
              </TouchableOpacity>

              <Text style={styles.historySectionTitle}>RECENT CHATS</Text>

              {historyLoading ? (
                <View style={styles.historyLoading}>
                  <ActivityIndicator size="small" color={COLORS.mint} />

                  <Text style={styles.historyEmptyText}>
                    Loading conversations...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={conversations}
                  keyExtractor={(item, index) =>
                    item.id || `conversation-${index}`
                  }
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.historyList}
                  ListEmptyComponent={
                    <View style={styles.historyEmpty}>
                      <Ionicons
                        name="chatbubbles-outline"
                        size={30}
                        color={COLORS.mint}
                      />

                      <Text style={styles.historyEmptyText}>
                        No saved conversations yet.
                      </Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <View
                      style={[
                        styles.historyItem,
                        conversationId === item.id &&
                          styles.historyItemActive,
                      ]}
                    >
                      <View style={styles.historyItemIcon}>
                        <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={17}
                          color={COLORS.primary}
                        />
                      </View>

                      <View style={styles.historyItemTextContainer}>
                        {editingConversationId === item.id ? (
                          <View style={styles.renameRow}>
                            <TextInput
                              value={editingTitle}
                              onChangeText={setEditingTitle}
                              style={styles.renameInput}
                              placeholder="Conversation title"
                              maxLength={60}
                              autoFocus
                              returnKeyType="done"
                              onSubmitEditing={() =>
                                saveConversationTitle(item.id)
                              }
                            />

                            <TouchableOpacity
                              onPress={() =>
                                saveConversationTitle(item.id)
                              }
                              style={styles.historyActionButton}
                            >
                              <Ionicons
                                name="checkmark-circle"
                                size={22}
                                color={COLORS.mintDark}
                              />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => {
                                setEditingConversationId(null);
                                setEditingTitle("");
                              }}
                              style={styles.historyActionButton}
                            >
                              <Ionicons
                                name="close-circle"
                                size={22}
                                color={COLORS.secondary}
                              />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => openConversation(item.id)}
                          >
                            <Text
                              style={styles.historyItemTitle}
                              numberOfLines={1}
                            >
                              {item.title || "Leo conversation"}
                            </Text>

                            <Text
                              style={styles.historyItemDate}
                              numberOfLines={1}
                            >
                              {item.isPinned
                                ? "Pinned · Tap to continue"
                                : "Tap to continue this chat"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {editingConversationId !== item.id && (
                        <View style={styles.historyItemActions}>
                          <TouchableOpacity
                            onPress={() => toggleConversationPin(item)}
                            style={styles.historyActionButton}
                            accessibilityLabel={
                              item.isPinned
                                ? "Unpin conversation"
                                : "Pin conversation"
                            }
                          >
                            <Ionicons
                              name={
                                item.isPinned ? "pin" : "pin-outline"
                              }
                              size={17}
                              color={
                                item.isPinned
                                  ? COLORS.mintDark
                                  : COLORS.secondary
                              }
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => {
                              setEditingConversationId(item.id);
                              setEditingTitle(item.title || "");
                            }}
                            style={styles.historyActionButton}
                            accessibilityLabel="Rename conversation"
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={17}
                              color={COLORS.primary}
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => deleteConversation(item)}
                            style={styles.historyActionButton}
                            accessibilityLabel="Delete conversation"
                          >
                            <Ionicons
                              name="trash-outline"
                              size={17}
                              color={COLORS.error}
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const markdownStyles = {
  body: {
    color: "#111827",
    fontSize: 13,
    lineHeight: 20,
  },
  heading1: {
    fontSize: 19,
    fontWeight: "800" as const,
    color: "#312E81",
    marginTop: 8,
    marginBottom: 6,
  },
  heading2: {
    fontSize: 17,
    fontWeight: "800" as const,
    color: "#312E81",
    marginTop: 8,
    marginBottom: 5,
  },
  heading3: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#312E81",
    marginTop: 7,
    marginBottom: 4,
  },
  paragraph: { marginTop: 3, marginBottom: 8 },
  strong: { fontWeight: "800" as const },
  bullet_list: { marginVertical: 5 },
  ordered_list: { marginVertical: 5 },
  list_item: { marginVertical: 2 },
  code_inline: {
    backgroundColor: "#EEF0F5",
    color: "#4338CA",
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  code_block: {
    backgroundColor: "#F1F3F8",
    padding: 10,
    borderRadius: 8,
    color: "#1F2937",
  },
  fence: {
    backgroundColor: "#F1F3F8",
    padding: 10,
    borderRadius: 8,
    color: "#1F2937",
  },
  blockquote: {
    backgroundColor: "#F5F7FB",
    borderLeftColor: "#38B2AC",
    borderLeftWidth: 3,
    paddingHorizontal: 9,
  },
  table: {
    borderWidth: 1,
    borderColor: "#DDE2EA",
    borderRadius: 6,
  },
  th: {
    backgroundColor: "#EEF0FF",
    padding: 6,
    fontWeight: "700" as const,
  },
  td: {
    padding: 6,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  hr: {
    backgroundColor: "#E5E7EB",
    height: 1,
    marginVertical: 8,
  },
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  mainContainer: {
    flex: 1,
  },

  // WELCOME SCREEN

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

  welcomeHistoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.75)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
  },

  welcomeHistoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
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

  // CHAT SCREEN

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

  chatHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  historyButton: {
    width: 37,
    height: 37,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#EEF0FF",
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

  // TYPING INDICATOR

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

  // COMPOSER

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

  // CHAT HISTORY DRAWER

  historyOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    flexDirection: "row",
  },

  historyBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.38)",
  },

  historyDrawer: {
    width: "82%",
    maxWidth: 340,
    height: "100%",
    backgroundColor: COLORS.white,
    paddingTop: 22,
    paddingHorizontal: 17,
    paddingBottom: 12,
    elevation: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 3, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },

  historyDrawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  historyDrawerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },

  historyDrawerSubtitle: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 4,
  },

  historyCloseButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  historyNewChatButton: {
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    marginBottom: 24,
  },

  historyNewChatText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
  },

  historySectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: COLORS.secondary,
    marginBottom: 10,
  },

  historyList: {
    paddingBottom: 20,
  },

  historyLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingVertical: 25,
  },

  historyEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
    paddingVertical: 35,
    gap: 10,
  },

  historyEmptyText: {
    fontSize: 11,
    color: COLORS.secondary,
    textAlign: "center",
  },

  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 9,
    borderRadius: 12,
    marginBottom: 5,
    gap: 10,
  },

  historyItemActive: {
    backgroundColor: "#EEF0FF",
  },

  historyItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
  },

  historyItemTextContainer: {
    flex: 1,
  },

  historyItemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  historyActionButton: {
    width: 29,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  renameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  renameInput: {
    flex: 1,
    minWidth: 70,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 5,
    fontSize: 11,
    color: COLORS.text,
  },

  historyItemTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },

  historyItemDate: {
    fontSize: 10,
    color: COLORS.secondary,
    marginTop: 4,
  },

  // ATTACHMENT PREVIEW

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
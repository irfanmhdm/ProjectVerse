import React, { useRef, useState, useEffect, useMemo } from "react";

import {
  View, Text, StyleSheet, Image, TextInput, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar, Animated, Easing, Pressable, ScrollView, TouchableOpacity,
  useWindowDimensions, Keyboard, BackHandler, StyleProp, ViewStyle,
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

const LEO_IMAGE = require("../../assets/images/leo.png");

// Leo's artwork is 1086 x 1448. These ratios locate his head and the
// antenna ball inside the image, so the avatar crop and the signal rings
// line up with the artwork.
const LEO_ASPECT = 1086 / 1448;
const LEO_ANTENNA_X = 0.624;
const LEO_ANTENNA_Y = 0.046;
const LEO_HEAD_X = 0.53;
const LEO_HEAD_Y = 0.33;

const MAX_PINNED_CHATS = 10;

// Official ProjectVerse palette plus tints and shades derived from it.
const COLORS = {
  // Primary Indigo and its derived shades
  indigo: "#4338CA",
  indigoDeep: "#312E81",
  indigoInk: "#1E1B4B",
  indigoSoft: "#EEF0FF",
  indigoTint: "#E0E2FB",
  indigoMuted: "#9F9BE6",

  // Secondary Mint and its derived shades
  mint: "#38B2AC",
  mintDark: "#0D9488",
  mintSoft: "#D5F5F2",
  mintTint: "#EEFBF9",

  // Neutrals
  background: "#F5F7FB",
  surface: "#FFFFFF",
  text: "#1F2937",
  secondary: "#6B7280",
  border: "#E5E7EB",
  borderSoft: "#ECEFF5",

  // Used only for the destructive "delete" action, as before.
  error: "#DC2626",
};

// Rounded display face on iOS, heavy sans on Android; body text uses the
// platform default for legibility.
const FONT_DISPLAY = Platform.select({
  ios: "ArialRoundedMTBold",
  android: "sans-serif-black",
  default: undefined,
});

const FONT_MONO = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: undefined,
});

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Burning the midnight oil";
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

type DrawerRow =
  | { key: string; type: "header"; title: string; meta: string; pinned: boolean }
  | { key: string; type: "empty"; text: string }
  | { key: string; type: "chat"; item: Conversation };

// =====================================================
// SMALL BUILDING BLOCKS
// =====================================================

// Pressable that springs down slightly while held.
type ScalePressProps = {
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  accessibilityLabel?: string;
  scaleTo?: number;
  hitSlop?: number;
};

function ScalePress({
  onPress,
  disabled,
  style,
  containerStyle,
  children,
  accessibilityLabel,
  scaleTo = 0.93,
  hitSlop,
}: ScalePressProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const springTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      speed: 40,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => springTo(scaleTo)}
      onPressOut={() => springTo(1)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={hitSlop}
      style={containerStyle}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// Expanding rings, like a signal leaving Leo's antenna.
type PingRingsProps = {
  size: number;
  color: string;
  from?: number;
  to?: number;
  count?: number;
  borderWidth?: number;
  peakOpacity?: number;
  duration?: number;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
};

function PingRings({
  size,
  color,
  from = 1,
  to = 2.1,
  count = 2,
  borderWidth = 1.5,
  peakOpacity = 0.5,
  duration = 1800,
  active = true,
  style,
}: PingRingsProps) {
  const values = useRef(
    Array.from({ length: count }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (!active) {
      values.forEach((value) => value.setValue(0));
      return;
    }

    const gap = duration / 2;

    const loops = values.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * gap),
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay((count - 1 - index) * gap),
        ]),
      ),
    );

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [active, count, duration, values]);

  return (
    <View
      pointerEvents="none"
      style={[{ position: "absolute", width: size, height: size }, style]}
    >
      {values.map((value, index) => (
        <Animated.View
          key={index}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderColor: color,
            opacity: value.interpolate({
              inputRange: [0, 0.12, 1],
              outputRange: [0, peakOpacity, 0],
            }),
            transform: [
              {
                scale: value.interpolate({
                  inputRange: [0, 1],
                  outputRange: [from, to],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}

// Round crop of Leo's head (antenna included) on soft mint.
function LeoAvatar({
  size,
  pinging = false,
  badge = false,
}: {
  size: number;
  pinging?: boolean;
  badge?: boolean;
}) {
  const imageWidth = size * 1.15;
  const imageHeight = imageWidth / LEO_ASPECT;
  const badgeSize = Math.max(9, size * 0.28);

  return (
    <View style={{ width: size, height: size }}>
      {pinging && <PingRings size={size} color={COLORS.mint} />}

      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          backgroundColor: COLORS.mintSoft,
        }}
      >
        <Image
          source={LEO_IMAGE}
          resizeMode="contain"
          style={{
            position: "absolute",
            width: imageWidth,
            height: imageHeight,
            left: size / 2 - imageWidth * LEO_HEAD_X,
            top: size / 2 - imageHeight * LEO_HEAD_Y,
          }}
        />
      </View>

      {badge && (
        <View
          style={{
            position: "absolute",
            right: -1,
            bottom: -1,
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: COLORS.mint,
            borderWidth: 2,
            borderColor: COLORS.surface,
          }}
        />
      )}
    </View>
  );
}

// One chat message. The user's messages are indigo bubbles; Leo's replies
// are white notes with a mint spine, so the two voices never blur together.
// New messages ease in once; restored messages appear instantly.
const MessageItem = React.memo(function MessageItem({
  item,
  seenIds,
}: {
  item: Message;
  seenIds: React.MutableRefObject<Set<string>>;
}) {
  const isUser = item.role === "user";
  const alreadySeen = useRef(seenIds.current.has(item.id)).current;
  const progress = useRef(new Animated.Value(alreadySeen ? 1 : 0)).current;

  useEffect(() => {
    if (alreadySeen) return;

    seenIds.current.add(item.id);

    Animated.timing(progress, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [alreadySeen, item.id, progress, seenIds]);

  const animatedStyle = {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  if (isUser) {
    return (
      <Animated.View style={[styles.userRow, animatedStyle]}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{item.content}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.leoRow, animatedStyle]}>
      <View style={styles.leoMeta}>
        <LeoAvatar size={26} />
        <Text style={styles.leoName}>Leo</Text>
      </View>

      <View style={styles.leoCardShadow}>
        <View style={styles.leoCard}>
          <View style={styles.leoSpine} />

          <View style={styles.leoCardContent}>
            <Markdown style={markdownStyles}>{item.content || ""}</Markdown>
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

// "Leo is thinking" row: his avatar pings like an antenna transmitting.
function ThinkingRow({ creating }: { creating: boolean }) {
  return (
    <View style={styles.thinkingRow}>
      <LeoAvatar size={30} pinging />

      <View style={styles.thinkingBubble}>
        <ActivityIndicator size="small" color={COLORS.mint} />

        <Text style={styles.thinkingText}>
          {creating ? "Starting conversation..." : "Leo is thinking..."}
        </Text>
      </View>
    </View>
  );
}

// =====================================================
// MAIN SCREEN
// =====================================================

export default function AIMentorScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  const flatListRef = useRef<FlatList>(null);
  const pendingRestoreScrollRef = useRef(false);
  const restoreSettleUntilRef = useRef(0);
  const messageContentHeightRef = useRef(0);
  const messageListLaidOutRef = useRef(false);
  const restoreScrollFrameRef = useRef<number | null>(null);
  const inputRef = useRef<TextInput>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const pendingMessageRef = useRef("");
  const pendingMessageIdRef = useRef<string | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

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
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 1500,
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
    outputRange: [0, -7],
  });

  // STATES

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const [selectedAttachment, setSelectedAttachment] =
    useState<SelectedAttachment | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editingConversationId, setEditingConversationId] =
    useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // LEFT DRAWER ANIMATION

  const drawerAnim = useRef(new Animated.Value(0)).current;
  const drawerWidth = Math.min(width * 0.86, 340);

  useEffect(() => {
    if (!historyVisible) return;

    drawerAnim.setValue(0);

    Animated.timing(drawerAnim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [historyVisible, drawerAnim]);

  const openHistory = () => {
    Keyboard.dismiss();
    drawerAnim.setValue(0);
    setHistoryVisible(true);
    fetchConversations();
  };

  const closeHistory = () => {
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 210,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setHistoryVisible(false);
    });
  };

  // Android hardware back button closes the drawer first.
  useEffect(() => {
    if (!historyVisible) return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        closeHistory();
        return true;
      },
    );

    return () => subscription.remove();
  }, [historyVisible]);

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

  // Restore an opened conversation at its latest message.
  // Wait for both the FlatList viewport and its content to be laid out before scrolling.
  const scrollRestoredConversationToBottom = () => {
    if (
      !pendingRestoreScrollRef.current ||
      !messageListLaidOutRef.current ||
      messageContentHeightRef.current <= 0
    ) {
      return;
    }

    if (restoreScrollFrameRef.current !== null) {
      cancelAnimationFrame(restoreScrollFrameRef.current);
    }

    restoreScrollFrameRef.current = requestAnimationFrame(() => {
      restoreScrollFrameRef.current = requestAnimationFrame(() => {
        const contentHeight = messageContentHeightRef.current;

        // scrollToOffset uses the measured content height and lets the native
        // ScrollView clamp to the actual maximum offset.
        flatListRef.current?.scrollToOffset({
          offset: contentHeight + 100,
          animated: false,
        });

        pendingRestoreScrollRef.current = false;
        restoreScrollFrameRef.current = null;

        // Long Markdown replies can finish measuring after this scroll, so
        // keep following the content height for a moment while it settles.
        restoreSettleUntilRef.current = Date.now() + 900;
      });
    });
  };

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
      pendingRestoreScrollRef.current = savedMessages.length > 0;
      restoreSettleUntilRef.current = 0;
      messageContentHeightRef.current = 0;
      messageListLaidOutRef.current = false;

      const restoredMessages: Message[] = savedMessages.map(
        (message: any, index: number) => ({
          id: message.id || `${message.role}-${index}`,
          role: message.role === "user" ? "user" : "assistant",
          content: message.content || "",
        }),
      );

      // Restored messages appear instantly; only new ones animate in.
      restoredMessages.forEach((message) =>
        seenMessageIdsRef.current.add(message.id),
      );

      setMessages(restoredMessages);

      setInput("");
      setSelectedAttachment(null);
      setHasStarted(true);
      closeHistory();

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
      conversations.filter((chat) => chat.isPinned).length >= MAX_PINNED_CHATS
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

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageItem item={item} seenIds={seenMessageIdsRef} />
  );

  // Title of the conversation currently open (shown under Leo's name).
  const activeConversationTitle = useMemo(
    () => conversations.find((chat) => chat.id === conversationId)?.title,
    [conversations, conversationId],
  );

  const canSend = !!input.trim() || !!selectedAttachment;
  const greeting = useMemo(getGreeting, []);

  // Drawer content: a dedicated Pinned Chats section, then Recent Chats.
  const drawerRows = useMemo<DrawerRow[]>(() => {
    const pinned = conversations.filter((chat) => chat.isPinned);
    const recent = conversations.filter((chat) => !chat.isPinned);

    const rows: DrawerRow[] = [];

    rows.push({
      key: "header-pinned",
      type: "header",
      title: "Pinned Chats",
      meta: `${pinned.length}/${MAX_PINNED_CHATS}`,
      pinned: true,
    });

    if (pinned.length === 0) {
      rows.push({
        key: "empty-pinned",
        type: "empty",
        text: "Pin a chat to keep it here.",
      });
    } else {
      pinned.forEach((item) =>
        rows.push({ key: `chat-${item.id}`, type: "chat", item }),
      );
    }

    rows.push({
      key: "header-recent",
      type: "header",
      title: "Recent Chats",
      meta: recent.length > 0 ? String(recent.length) : "",
      pinned: false,
    });

    if (recent.length === 0) {
      rows.push({
        key: "empty-recent",
        type: "empty",
        text: "No saved conversations yet.",
      });
    } else {
      recent.forEach((item) =>
        rows.push({ key: `chat-${item.id}`, type: "chat", item }),
      );
    }

    return rows;
  }, [conversations]);

  // =====================================================
  // WELCOME SCREEN
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
          onPress={openHistory}
          activeOpacity={0.75}
        >
          <Ionicons name="time-outline" size={18} color={COLORS.indigo} />
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
      {/* FLOATING HEADER */}

      <View style={styles.chatTopBar}>
        <ScalePress
          onPress={openHistory}
          style={styles.menuButtonTinted}
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu" size={22} color={COLORS.indigo} />
        </ScalePress>

        <View style={styles.chatTopInfo}>
          <LeoAvatar size={40} pinging={loading} badge />

          <View style={styles.chatTitleColumn}>
            <Text style={styles.chatTopTitle}>Leo</Text>

            <Text style={styles.chatSubtitle} numberOfLines={1}>
              {activeConversationTitle || "ProjectVerse AI Mentor"}
            </Text>
          </View>
        </View>

        <ScalePress
          onPress={handleNewChat}
          disabled={loading}
          style={[styles.newChatIconButton, loading && styles.dimmed]}
          accessibilityLabel="Start a new chat"
        >
          <Ionicons name="create-outline" size={20} color={COLORS.mintDark} />
        </ScalePress>
      </View>

      {/* MESSAGES */}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item.id || `${item.role}-${index}`}
        renderItem={renderMessage}
        style={styles.messageListWrapper}
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
                source={LEO_IMAGE}
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
          loading ? <ThinkingRow creating={creatingConversation} /> : null
        }
        onLayout={() => {
          messageListLaidOutRef.current = true;
          scrollRestoredConversationToBottom();
        }}
        onContentSizeChange={(_width, contentHeight) => {
          messageContentHeightRef.current = contentHeight;
          scrollRestoredConversationToBottom();

          // Keep following the bottom while a restored conversation settles.
          if (
            !pendingRestoreScrollRef.current &&
            Date.now() < restoreSettleUntilRef.current
          ) {
            flatListRef.current?.scrollToOffset({
              offset: contentHeight + 100,
              animated: false,
            });
          }
        }}
      />
    </View>
  );

  // =====================================================
  // DRAWER ROWS
  // =====================================================

  const renderDrawerRow = ({ item: row }: { item: DrawerRow }) => {
    if (row.type === "header") {
      return (
        <View style={styles.drawerSectionHeader}>
          <View
            style={[
              styles.drawerSectionIcon,
              row.pinned && styles.drawerSectionIconPinned,
            ]}
          >
            <Ionicons
              name={row.pinned ? "pin" : "time-outline"}
              size={13}
              color={row.pinned ? COLORS.mintDark : COLORS.indigo}
            />
          </View>

          <Text style={styles.drawerSectionTitle}>{row.title}</Text>

          {!!row.meta && (
            <Text style={styles.drawerSectionMeta}>{row.meta}</Text>
          )}
        </View>
      );
    }

    if (row.type === "empty") {
      return <Text style={styles.drawerEmptyText}>{row.text}</Text>;
    }

    const item = row.item;
    const isActive = conversationId === item.id;
    const isEditing = editingConversationId === item.id;

    return (
      <View style={[styles.historyItem, isActive && styles.historyItemActive]}>
        {isActive && <View style={styles.historyItemActiveBar} />}

        <View
          style={[
            styles.historyItemIcon,
            item.isPinned && styles.historyItemIconPinned,
          ]}
        >
          <Ionicons
            name={item.isPinned ? "pin" : "chatbubble-ellipses-outline"}
            size={16}
            color={item.isPinned ? COLORS.mintDark : COLORS.indigo}
          />
        </View>

        <View style={styles.historyItemTextContainer}>
          {isEditing ? (
            <View style={styles.renameRow}>
              <TextInput
                value={editingTitle}
                onChangeText={setEditingTitle}
                style={styles.renameInput}
                placeholder="Conversation title"
                placeholderTextColor="#9CA3AF"
                maxLength={60}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => saveConversationTitle(item.id)}
              />

              <Pressable
                onPress={() => saveConversationTitle(item.id)}
                style={styles.historyActionButton}
                accessibilityRole="button"
                accessibilityLabel="Save title"
              >
                <Ionicons
                  name="checkmark-circle"
                  size={23}
                  color={COLORS.mintDark}
                />
              </Pressable>

              <Pressable
                onPress={() => {
                  setEditingConversationId(null);
                  setEditingTitle("");
                }}
                style={styles.historyActionButton}
                accessibilityRole="button"
                accessibilityLabel="Cancel rename"
              >
                <Ionicons
                  name="close-circle"
                  size={23}
                  color={COLORS.secondary}
                />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => openConversation(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.title || "Leo conversation"}`}
            >
              <Text style={styles.historyItemTitle} numberOfLines={2}>
                {item.title || "Leo conversation"}
              </Text>

              <Text style={styles.historyItemDate} numberOfLines={1}>
                {item.isPinned
                  ? "Pinned · Tap to continue"
                  : "Tap to continue this chat"}
              </Text>
            </Pressable>
          )}
        </View>

        {!isEditing && (
          <View style={styles.historyItemActions}>
            <Pressable
              onPress={() => toggleConversationPin(item)}
              style={styles.historyActionButton}
              accessibilityRole="button"
              accessibilityLabel={
                item.isPinned ? "Unpin conversation" : "Pin conversation"
              }
            >
              <Ionicons
                name={item.isPinned ? "pin" : "pin-outline"}
                size={17}
                color={item.isPinned ? COLORS.mintDark : COLORS.secondary}
              />
            </Pressable>

            <Pressable
              onPress={() => {
                setEditingConversationId(item.id);
                setEditingTitle(item.title || "");
              }}
              style={styles.historyActionButton}
              accessibilityRole="button"
              accessibilityLabel="Rename conversation"
            >
              <Ionicons name="pencil-outline" size={17} color={COLORS.indigo} />
            </Pressable>

            <Pressable
              onPress={() => deleteConversation(item)}
              style={styles.historyActionButton}
              accessibilityRole="button"
              accessibilityLabel="Delete conversation"
            >
              <Ionicons name="trash-outline" size={17} color={COLORS.error} />
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.mainContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 5 : 0}
      >
        {!hasStarted ? renderWelcomeScreen() : renderChatScreen()}

        {/* MESSAGE COMPOSER */}

        <View style={styles.composerDock}>
          <View
            style={[
              styles.composerCard,
              inputFocused && styles.composerCardFocused,
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
                    size={22}
                    color={COLORS.mintDark}
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

                <Pressable
                  onPress={removeAttachment}
                  style={styles.removeAttachmentButton}
                  accessibilityRole="button"
                  accessibilityLabel="Remove attachment"
                  hitSlop={8}
                >
                  <Ionicons
                    name="close-circle"
                    size={22}
                    color={COLORS.secondary}
                  />
                </Pressable>
              </View>
            )}

            {/* INPUT AREA */}

            <View style={styles.composerRow}>
              {hasStarted && (
                <ScalePress
                  onPress={pickAttachment}
                  disabled={loading}
                  style={[styles.attachButton, loading && styles.dimmed]}
                  accessibilityLabel="Attach PDF or image"
                >
                  <Ionicons
                    name="attach-outline"
                    size={22}
                    color={COLORS.mintDark}
                  />
                </ScalePress>
              )}

              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder="Ask Leo anything..."
                placeholderTextColor="#9CA3AF"
                value={input}
                onChangeText={setInput}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                multiline
                maxLength={5000}
                editable={!loading}
                returnKeyType="default"
                blurOnSubmit={false}
              />

              {/* SEND / STOP BUTTON */}

              <ScalePress
                onPress={() => {
                  if (loading) {
                    stopThinking();
                    return;
                  }

                  sendMessage();
                }}
                disabled={!loading && !canSend}
                style={[
                  styles.sendButton,
                  loading
                    ? styles.sendButtonStop
                    : canSend
                      ? styles.sendButtonActive
                      : styles.sendButtonIdle,
                ]}
                accessibilityLabel={loading ? "Stop response" : "Send message"}
              >
                <Ionicons
                  name={loading ? "stop" : "arrow-up"}
                  size={loading ? 17 : 21}
                  color={
                    loading || canSend ? COLORS.surface : COLORS.indigoMuted
                  }
                />
              </ScalePress>
            </View>
          </View>

          <Text style={styles.composerFooter}>
            Leo can make mistakes. Verify important information.
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* LEFT NAVIGATION DRAWER */}

      {historyVisible && (
        <View style={styles.drawerOverlay}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.drawerBackdrop,
              { opacity: drawerAnim },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeHistory}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.drawer,
              {
                width: drawerWidth,
                transform: [
                  {
                    translateX: drawerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-drawerWidth, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* TOP SECTION: LEO IDENTITY + NEW CHAT */}

            <View style={styles.drawerHeader}>
              <LeoAvatar size={46} badge />

              <View style={styles.drawerBrandText}>
                <Text style={styles.drawerBrandName}>Leo</Text>

                <Text style={styles.drawerBrandSub} numberOfLines={1}>
                  ProjectVerse AI Mentor
                </Text>
              </View>

              <ScalePress
                onPress={closeHistory}
                style={styles.drawerCloseButton}
                accessibilityLabel="Close menu"
              >
                <Ionicons name="close" size={20} color={COLORS.text} />
              </ScalePress>
            </View>

            <ScalePress
              onPress={() => {
                closeHistory();

                if (messages.length > 0 || conversationId) {
                  handleNewChat();
                }
              }}
              disabled={loading}
              scaleTo={0.97}
              containerStyle={styles.drawerNewChatContainer}
              style={[styles.drawerNewChatButton, loading && styles.dimmed]}
              accessibilityLabel="Start new chat"
            >
              <Ionicons name="add-circle" size={21} color={COLORS.surface} />

              <Text style={styles.drawerNewChatText}>New Chat</Text>
            </ScalePress>

            {/* PINNED CHATS + RECENT CHATS */}

            {historyLoading && conversations.length === 0 ? (
              <View style={styles.historyLoading}>
                <ActivityIndicator size="small" color={COLORS.mint} />

                <Text style={styles.drawerEmptyText}>
                  Loading conversations...
                </Text>
              </View>
            ) : (
              <FlatList
                data={drawerRows}
                keyExtractor={(row) => row.key}
                renderItem={renderDrawerRow}
                style={styles.drawerList}
                contentContainerStyle={styles.historyList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={
                  historyLoading ? (
                    <View style={styles.historyRefreshing}>
                      <ActivityIndicator size="small" color={COLORS.mint} />

                      <Text style={styles.drawerEmptyInline}>Updating...</Text>
                    </View>
                  ) : null
                }
              />
            )}
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const markdownStyles = {
  body: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 23,
  },
  heading1: {
    fontFamily: FONT_DISPLAY,
    fontSize: 21,
    lineHeight: 27,
    color: COLORS.indigoDeep,
    marginTop: 8,
    marginBottom: 6,
  },
  heading2: {
    fontFamily: FONT_DISPLAY,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.indigoDeep,
    marginTop: 8,
    marginBottom: 5,
  },
  heading3: {
    fontFamily: FONT_DISPLAY,
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.indigo,
    marginTop: 7,
    marginBottom: 4,
  },
  paragraph: { marginTop: 0, marginBottom: 10 },
  strong: { fontWeight: "700" as const, color: COLORS.indigoDeep },
  em: { fontStyle: "italic" as const },
  link: {
    color: COLORS.indigo,
    textDecorationLine: "underline" as const,
  },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
  bullet_list_icon: { color: COLORS.mint, fontWeight: "700" as const },
  ordered_list_icon: { color: COLORS.mintDark, fontWeight: "700" as const },
  code_inline: {
    backgroundColor: COLORS.mintSoft,
    color: COLORS.mintDark,
    borderWidth: 0,
    paddingHorizontal: 4,
    borderRadius: 4,
    fontFamily: FONT_MONO,
  },
  code_block: {
    backgroundColor: COLORS.indigoInk,
    color: "#E4E5FB",
    borderWidth: 0,
    padding: 12,
    borderRadius: 12,
    fontSize: 12.5,
    lineHeight: 19,
    fontFamily: FONT_MONO,
  },
  fence: {
    backgroundColor: COLORS.indigoInk,
    color: "#E4E5FB",
    borderWidth: 0,
    padding: 12,
    borderRadius: 12,
    fontSize: 12.5,
    lineHeight: 19,
    fontFamily: FONT_MONO,
  },
  blockquote: {
    backgroundColor: COLORS.mintTint,
    borderLeftColor: COLORS.mint,
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginLeft: 0,
    borderRadius: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  th: {
    backgroundColor: COLORS.indigoSoft,
    padding: 6,
    fontWeight: "700" as const,
  },
  td: {
    padding: 6,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  hr: {
    backgroundColor: COLORS.border,
    height: 1,
    marginVertical: 12,
  },
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  dimmed: {
    opacity: 0.45,
  },

  // WELCOME SCREEN

  welcomeScreen: {
    flex: 1,
    backgroundColor: COLORS.mintTint,
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
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 30,
  },

  brandLabelText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    color: COLORS.mintDark,
  },


  welcomeHistoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
  },

  welcomeHistoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.secondary,
  },


  welcomeCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
  },

  heroMascotContainer: {
    width: 174,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  mascotGlow: {
    position: "absolute",
    width: 142,
    height: 142,
    borderRadius: 80,
    backgroundColor: COLORS.mintSoft,
    opacity: 0.85,
  },

  heroMascot: {
    width: 138,
    height: 158,
  },

  welcomeTitle: {
    fontSize: 31,
    fontWeight: "900",
    color: COLORS.indigoDeep,
    letterSpacing: -0.8,
    textAlign: "center",
  },

  welcomeSubtitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.secondary,
    marginTop: 9,
    textAlign: "center",
  },

  welcomeDescription: {
    fontSize: 13,
    lineHeight: 21,
    color: COLORS.secondary,
    marginTop: 13,
    textAlign: "center",
  },

  welcomeStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
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
    color: COLORS.mintDark,
  },

  welcomeFooter: {
    alignItems: "center",
    paddingVertical: 7,
  },

  footerText: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: "500",
  },

  // CHAT SCREEN

  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  chatTopBar: {
    marginHorizontal: 12,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    shadowColor: COLORS.indigo,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },

  menuButtonTinted: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.indigoSoft,
  },

  chatTopInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  chatTitleColumn: {
    flex: 1,
  },

  chatTopTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: 17,
    color: COLORS.text,
  },

  chatSubtitle: {
    fontSize: 11.5,
    color: COLORS.secondary,
    marginTop: 1,
  },

  newChatIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.mintSoft,
  },

  messageListWrapper: {
    flex: 1,
  },

  messageList: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 18,
  },

  // Leo's replies: a labelled note with a mint spine.

  leoRow: {
    alignSelf: "flex-start",
    maxWidth: "96%",
    marginBottom: 22,
  },

  leoMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 7,
    marginLeft: 2,
  },

  leoName: {
    fontFamily: FONT_DISPLAY,
    fontSize: 13,
    color: COLORS.indigo,
  },

  leoCardShadow: {
    borderRadius: 20,
    borderTopLeftRadius: 6,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.indigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },

  leoCard: {
    borderRadius: 20,
    borderTopLeftRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
  },

  leoSpine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.mint,
  },

  leoCardContent: {
    paddingLeft: 17,
    paddingRight: 15,
    paddingTop: 12,
    paddingBottom: 3,
  },

  // The user's messages: indigo bubbles.

  userRow: {
    alignItems: "flex-end",
    marginBottom: 22,
  },

  userBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    backgroundColor: COLORS.indigo,
    shadowColor: COLORS.indigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },

  userText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.surface,
  },

  emptyChat: {
    paddingVertical: 36,
    alignItems: "center",
  },

  emptyChatMascotContainer: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: COLORS.mintSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyChatMascot: {
    width: 82,
    height: 100,
  },

  emptyChatText: {
    fontFamily: FONT_DISPLAY,
    fontSize: 16,
    color: COLORS.indigoDeep,
    textAlign: "center",
  },

  // THINKING INDICATOR

  thinkingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    marginLeft: 2,
  },

  thinkingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  thinkingText: {
    fontSize: 12.5,
    color: COLORS.secondary,
  },

  // COMPOSER (fixed at the bottom)

  composerDock: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: Platform.OS === "ios" ? 5 : 9,
  },

  composerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 7,
    paddingVertical: 7,
    // shadowColor: COLORS.indigo,
    // shadowOffset: { width: 0, height: 6 },
    // shadowOpacity: 0.08,
    // shadowRadius: 16,
    // elevation: 4,
  },

  composerCardFocused: {
    borderColor: COLORS.indigo,
  },

  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },

  attachButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.mintSoft,
  },

  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    fontSize: 15,
    color: COLORS.text,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: "center",
  },

  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  sendButtonActive: {
    backgroundColor: COLORS.indigo,
  },

  sendButtonIdle: {
    backgroundColor: COLORS.indigoSoft,
  },

  sendButtonStop: {
    backgroundColor: COLORS.indigoDeep,
  },

  composerFooter: {
    textAlign: "center",
    fontSize: 10.5,
    color: COLORS.secondary,
    marginTop: 8,
    marginBottom: 2,
  },

  // LEFT DRAWER

  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    flexDirection: "row",
  },

  drawerBackdrop: {
    backgroundColor: "rgba(31, 41, 55, 0.42)",
  },

  drawer: {
    height: "100%",
    backgroundColor: COLORS.surface,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 10,
    elevation: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 3, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },

  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop:46,
    marginBottom: 16,
  },

  drawerBrandText: {
    flex: 1,
  },

  drawerBrandName: {
    fontFamily: FONT_DISPLAY,
    fontSize: 20,
    color: COLORS.indigo,
  },

  drawerBrandSub: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 1,
  },

  drawerCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  drawerNewChatContainer: {
    marginBottom: 14,
  },

  drawerNewChatButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: COLORS.indigo,
    shadowColor: COLORS.indigo,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },

  drawerNewChatText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.surface,
  },

  drawerList: {
    flex: 1,
  },

  drawerSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    marginBottom: 6,
    marginLeft: 2,
  },

  drawerSectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.indigoSoft,
  },

  drawerSectionIconPinned: {
    backgroundColor: COLORS.mintSoft,
  },

  drawerSectionTitle: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "700",
    color: COLORS.text,
  },

  drawerSectionMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.secondary,
  },

  drawerEmptyText: {
    fontSize: 12.5,
    color: COLORS.secondary,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  drawerEmptyInline: {
    fontSize: 12,
    color: COLORS.secondary,
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

  historyRefreshing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },

  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 4,
    borderRadius: 16,
    marginBottom: 2,
    gap: 10,
    overflow: "hidden",
  },

  historyItemActive: {
    backgroundColor: COLORS.indigoSoft,
  },

  historyItemActiveBar: {
    position: "absolute",
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
    backgroundColor: COLORS.indigo,
  },

  historyItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.indigoSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  historyItemIconPinned: {
    backgroundColor: COLORS.mintSoft,
  },

  historyItemTextContainer: {
    flex: 1,
  },

  historyItemActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  historyActionButton: {
    width: 28,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  renameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  renameInput: {
    flex: 1,
    minWidth: 70,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.indigo,
    paddingHorizontal: 2,
    paddingVertical: 5,
    fontSize: 13.5,
    color: COLORS.text,
  },

  historyItemTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: COLORS.text,
  },

  historyItemDate: {
    fontSize: 11.5,
    color: COLORS.secondary,
    marginTop: 3,
  },

  // ATTACHMENT PREVIEW

  attachmentPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.mintTint,
    borderRadius: 20,
    padding: 8,
    marginBottom: 7,
  },

  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.mintSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  attachmentInfo: {
    flex: 1,
  },

  attachmentName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  attachmentType: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 2,
  },

  removeAttachmentButton: {
    padding: 5,
  },
});

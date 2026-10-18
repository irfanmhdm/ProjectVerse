
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";

// =====================================================
// NOTIFICATION TYPE
// =====================================================

export type AppNotification = {
  id: string;
  recipientUid: string;
  title: string;
  message: string;
  type: string;
  projectId?: string | null;
  createdAt?: any;
  isRead?: boolean;
};

// =====================================================
// SEND NOTIFICATION
// =====================================================

export async function sendNotification({
  recipientUid,
  title,
  message,
  type,
  projectId,
}: {
  recipientUid: string;
  title: string;
  message: string;
  type: string;
  projectId?: string;
}) {
  if (!recipientUid) {
    throw new Error("Notification recipient is missing.");
  }

  await addDoc(collection(db, "notifications"), {
    recipientUid,
    title,
    message,
    type,
    projectId: projectId ?? null,
    isRead: false,
    createdAt: serverTimestamp(),
  });
}

// =====================================================
// LISTEN TO NOTIFICATIONS
// =====================================================

export function listenToNotifications(
  recipientUid: string,
  callback: (notifications: AppNotification[]) => void
) {
  const notificationsQuery = query(
    collection(db, "notifications"),
    where("recipientUid", "==", recipientUid),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
        // Existing notifications without isRead are
        // treated as unread for backward compatibility.
        isRead: document.data().isRead === true,
      })) as AppNotification[];

      callback(notifications);
    },
    (error) => {
      console.error("Notification listener error:", error);
    }
  );
}

// =====================================================
// MARK NOTIFICATIONS AS READ
// =====================================================

export async function markNotificationsAsRead(
  notifications: AppNotification[]
) {
  const unreadNotifications = notifications.filter(
    (notification) => notification.isRead !== true
  );

  if (unreadNotifications.length === 0) {
    return;
  }

  // Firestore batches support up to 500 writes.
  // Split large notification lists into safe batches.
  for (let i = 0; i < unreadNotifications.length; i += 450) {
    const batch = writeBatch(db);

    unreadNotifications.slice(i, i + 450).forEach((notification) => {
      batch.update(doc(db, "notifications", notification.id), {
        isRead: true,
      });
    });

    await batch.commit();
  }
}

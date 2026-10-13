
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
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
      })) as AppNotification[];

      callback(notifications);
    },
    (error) => {
      console.error("Notification listener error:", error);
    }
  );
}

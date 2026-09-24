import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";

// =====================================================
// GET ADMIN DASHBOARD COUNTS
// =====================================================

export const getAdminDashboardCounts = async () => {
  try {
    // -----------------------------------------------
    // GET USERS
    // -----------------------------------------------

    const usersSnapshot = await getDocs(
      collection(db, "users")
    );

    let totalStudents = 0;
    let totalGuides = 0;

    usersSnapshot.forEach((userDoc) => {
      const user = userDoc.data();

      // Students can register directly
      if (user.role === "student") {
        totalStudents++;
      }

      // Only approved guides count as guides
      if (
        user.role === "guide" &&
        user.approvalStatus === "approved"
      ) {
        totalGuides++;
      }
    });

    // -----------------------------------------------
    // SUBMITTED PROJECTS
    // -----------------------------------------------

    const submittedQuery = query(
      collection(db, "projects"),
      where("status", "==", "submitted")
    );

    const submittedSnapshot =
      await getDocs(submittedQuery);

    // -----------------------------------------------
    // APPROVED PROJECTS
    // -----------------------------------------------

    const approvedQuery = query(
      collection(db, "projects"),
      where("approvalStatus", "==", "approved")
    );

    const approvedSnapshot =
      await getDocs(approvedQuery);

    // -----------------------------------------------
    // RETURN COUNTS
    // -----------------------------------------------

    return {
      totalStudents,
      totalGuides,
      submittedProjects: submittedSnapshot.size,
      approvedProjects: approvedSnapshot.size,
    };

  } catch (error) {
    console.error(
      "Error fetching admin dashboard counts:",
      error
    );

    throw error;
  }
};


// =====================================================
// GET PENDING GUIDE REQUESTS
// =====================================================

export const getPendingGuides = async () => {
  try {

    const pendingQuery = query(
      collection(db, "users"),

      // User must be a guide
      where("role", "==", "guide"),

      // Guide must be waiting for admin approval
      where("approvalStatus", "==", "pending")
    );

    const snapshot = await getDocs(pendingQuery);

    console.log(
      "Pending guide requests:",
      snapshot.size
    );

    return snapshot.docs.map((guideDoc) => ({
      id: guideDoc.id,
      ...guideDoc.data(),
    }));

  } catch (error) {
    console.error(
      "Error fetching pending guides:",
      error
    );

    throw error;
  }
};


// =====================================================
// UPDATE GUIDE APPROVAL STATUS
// =====================================================

export const updateGuideStatus = async (
  guideId: string,
  status: "approved" | "rejected"
) => {
  try {

    const guideRef = doc(
      db,
      "users",
      guideId
    );

    await updateDoc(guideRef, {
      approvalStatus: status,
    });

    console.log(
      `Guide ${guideId} ${status}`
    );

    return true;

  } catch (error) {
    console.error(
      "Error updating guide status:",
      error
    );

    throw error;
  }
};
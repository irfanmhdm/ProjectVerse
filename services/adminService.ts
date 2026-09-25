import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";

// =====================================================
// TYPES
// =====================================================

export type Guide = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  status?: "pending" | "approved" | "rejected";
  createdAt?: any;
};

// =====================================================
// GET ADMIN DASHBOARD COUNTS
// =====================================================

export const getAdminDashboardCounts = async () => {
  try {

    // =================================================
    // GET ALL USERS
    // =================================================

    const usersSnapshot = await getDocs(
      collection(db, "users")
    );

    let totalStudents = 0;
    let totalGuides = 0;


    usersSnapshot.forEach((userDoc) => {

      const user = userDoc.data();


      // -----------------------------------------------
      // STUDENTS
      // -----------------------------------------------

      if (user.role === "student") {
        totalStudents++;
      }


      // -----------------------------------------------
      // GUIDES
      // -----------------------------------------------
      //
      // ONLY APPROVED GUIDES COUNT.
      //
      // The guide must have:
      //
      // role: "guide"
      // approvalStatus: "approved"
      //
      // pending and rejected guides are NOT counted.
      // -----------------------------------------------

      if (
        user.role === "guide" &&
        user.approvalStatus === "approved"
      ) {
        totalGuides++;
      }

    });


    // =================================================
    // GET PROJECTS
    // =================================================

    const projectsSnapshot = await getDocs(
      collection(db, "projects")
    );

    let submittedProjects = 0;
    let approvedProjects = 0;


    projectsSnapshot.forEach((projectDoc) => {

      const project = projectDoc.data();


      // -----------------------------------------------
      // SUBMITTED PROJECTS
      // -----------------------------------------------

      if (project.status === "submitted") {
        submittedProjects++;
      }


      // -----------------------------------------------
      // APPROVED PROJECTS
      // -----------------------------------------------

      if (
        project.approvalStatus === "approved"
      ) {
        approvedProjects++;
      }

    });


    // =================================================
    // DEBUG LOG
    // =================================================

    console.log(
      "================================="
    );

    console.log(
      "ADMIN DASHBOARD COUNTS"
    );

    console.log(
      "Students:",
      totalStudents
    );

    console.log(
      "Approved Guides:",
      totalGuides
    );

    console.log(
      "Submitted Projects:",
      submittedProjects
    );

    console.log(
      "Approved Projects:",
      approvedProjects
    );

    console.log(
      "================================="
    );


    // =================================================
    // RETURN COUNTS
    // =================================================

    return {
      totalStudents,
      totalGuides,
      submittedProjects,
      approvedProjects,
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

export const getPendingGuides = async (): Promise<Guide[]> => {
  try {
    // =================================================
    // GET ALL USERS
    // =================================================

    const usersSnapshot = await getDocs(
      collection(db, "users")
    );

    // =================================================
    // FILTER ONLY PENDING GUIDES
    // =================================================

    const pendingGuides: Guide[] = [];

    usersSnapshot.forEach((userDoc) => {
      const user = userDoc.data();

      // New guide registration should have:
      //
      // role: "guide"
      // approvalStatus: "pending"
      //

      if (
        user.role === "guide" &&
        user.approvalStatus === "pending"
      ) {
        pendingGuides.push({
          id: userDoc.id,
          ...user,
        });
      }
    });

    // =================================================
    // DEBUG
    // =================================================

    console.log(
      "Pending guide requests:",
      pendingGuides.length
    );

    console.log(
      "Pending guides:",
      pendingGuides
    );

    return pendingGuides;

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
    // =================================================
    // GUIDE DOCUMENT
    // =================================================

    const guideRef = doc(
      db,
      "users",
      guideId
    );

    // =================================================
    // UPDATE APPROVAL STATUS
    // =================================================

    await updateDoc(guideRef, {
      approvalStatus: status,
    });

    console.log(
      `Guide ${guideId} approval status updated to: ${status}`
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
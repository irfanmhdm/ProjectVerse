import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";


// ==========================================
// GET ADMIN DASHBOARD COUNTS
// ==========================================

export const getAdminDashboardCounts = async () => {
  try {

    // --------------------------------------
    // GET ALL USERS
    // --------------------------------------

    const usersSnapshot = await getDocs(
      collection(db, "users")
    );

    let totalStudents = 0;
    let totalGuides = 0;

    usersSnapshot.forEach((doc) => {

      const user = doc.data();

      if (user.role === "student") {
        totalStudents++;
      }

      if (user.role === "guide") {
        totalGuides++;
      }

    });


    // --------------------------------------
    // GET SUBMITTED PROJECTS
    // --------------------------------------

    const submittedProjectsQuery = query(
      collection(db, "projects"),
      where("status", "==", "submitted")
    );

    const submittedProjectsSnapshot =
      await getDocs(submittedProjectsQuery);


    // --------------------------------------
    // GET APPROVED PROJECTS
    // --------------------------------------

    const approvedProjectsQuery = query(
      collection(db, "projects"),
      where("status", "==", "approved")
    );

    const approvedProjectsSnapshot =
      await getDocs(approvedProjectsQuery);


    // --------------------------------------
    // RETURN COUNTS
    // --------------------------------------

    return {
      totalStudents,
      totalGuides,
      submittedProjects:
        submittedProjectsSnapshot.size,
      approvedProjects:
        approvedProjectsSnapshot.size,
    };

  } catch (error) {

    console.error(
      "Error fetching admin dashboard counts:",
      error
    );

    throw error;
  }
};
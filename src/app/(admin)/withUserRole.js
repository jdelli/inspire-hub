import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../script/firebaseConfig";

const withUserRole = (WrappedComponent, allowedRoles = ["admin"]) => {
  return function WithUserRoleWrapper(props) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          } else {
            setRole(null);
          }
        } else {
          setRole(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }, []);

    useEffect(() => {
      if (loading) return;

      // If not logged in, redirect to /notauthorize
      if (!user) {
        router.replace("/notauthorize");
        return;
      }

      // If logged in but role is not allowed, redirect to /notauthorize
      if (!allowedRoles.includes(role)) {
        router.replace("/notauthorize");
      }
    }, [loading, user, role, router]);

    return (
      <WrappedComponent
        {...props}
        user={user}
        role={role}
        loadingUserRole={loading}
      />
    );
  };
};

export default withUserRole;
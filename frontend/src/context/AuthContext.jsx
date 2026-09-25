import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  const loginAdmin = async (username, password) => {
    const user = await authService.loginAdmin(username, password);
    setCurrentUser(user);
    return user;
  };

  const loginOfficer = async (username, password) => {
    const user = await authService.loginOfficer(username, password);
    setCurrentUser(user);
    return user;
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const updatePassword = (newPassword) => {
    if (!currentUser) return null;
    const updated = authService.updatePassword(currentUser.id, newPassword);
    setCurrentUser(updated);
    return updated;
  };

  const updateUserProfile = (profileData) => {
    if (!currentUser) return null;
    const updated = authService.updateUserProfile(currentUser.id, profileData);
    setCurrentUser(updated);
    return updated;
  };

  const registerOfficer = (officerData) => {
    return authService.registerOfficerAccount(officerData);
  };

  const verifyPin = (inputPin) => {
    return authService.verifyPin(inputPin);
  };

  const updatePin = (newPin) => {
    return authService.updateSecurityPin(newPin);
  };

  const value = {
    currentUser,
    userRole: currentUser?.role || null,
    isAdmin: currentUser?.role === "ADMIN",
    isOfficer: currentUser?.role === "OFFICER",
    isAuthenticated: Boolean(currentUser),
    loading,
    loginAdmin,
    loginOfficer,
    logout,
    updatePassword,
    updateUserProfile,
    registerOfficer,
    verifyPin,
    updatePin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * authService.js
 * 
 * Stateful Authentication, Credentials, & Security PIN Client.
 * Backed by localStorage for session persistence across browser refreshes.
 */

const USERS_STORAGE_KEY = "ksp_auth_users_v6_pinterest_avatars";
const SESSION_STORAGE_KEY = "ksp_auth_session_v6";
const PIN_STORAGE_KEY = "ksp_security_pin_v6";

const DEFAULT_SECURITY_PIN = "1122";

const OFFICER_PHOTOS = [
  "https://i.pinimg.com/1200x/27/0c/e1/270ce1193cbdc1cb9f4211e8e0eaf87d.jpg",
  "https://i.pinimg.com/1200x/3a/01/97/3a0197357a4ad3428b34eb8884cf4cea.jpg",
  "https://i.pinimg.com/736x/2c/11/3f/2c113fd9405b68fa8e59fbf22a17ed45.jpg",
  "https://i.pinimg.com/1200x/4a/00/0f/4a000f954bc84e713ce910bc90de34f9.jpg",
  "https://i.pinimg.com/736x/09/74/48/0974482cba0effe8a902070d27fcc952.jpg",
  "https://i.pinimg.com/1200x/18/1e/26/181e26c023cfd2c8eee90ebb99fbddfb.jpg",
  "https://i.pinimg.com/736x/a5/9f/3e/a59f3e2c45390d5ff9ba4291a77f1212.jpg",
  "https://i.pinimg.com/736x/80/7b/ec/807bec8232c15e4db104f32fa1887835.jpg"
];

const INITIAL_USERS = [
  {
    id: "u-admin",
    username: "admin",
    password: "admin",
    name: "ACP Director (Admin)",
    role: "ADMIN",
    rank: "Command Director",
    kgid: "KSP-ADMIN-01",
    badge: "KSP-ADMIN-01",
    unit: "KSP Intelligence HQ",
    avatar: OFFICER_PHOTOS[0]
  }
];

// Load Users
const loadUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed loading users from storage:", err);
    return INITIAL_USERS;
  }
};

const saveUsers = (users) => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error("Failed saving users to storage:", err);
  }
};

// Session Management
const loadSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    return null;
  } catch (err) {
    return null;
  }
};

const saveSession = (user) => {
  try {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (err) {
    console.error("Failed saving session:", err);
  }
};

// PIN Management
const loadPin = () => {
  try {
    const raw = localStorage.getItem(PIN_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PIN_STORAGE_KEY, DEFAULT_SECURITY_PIN);
      return DEFAULT_SECURITY_PIN;
    }
    return raw;
  } catch (err) {
    return DEFAULT_SECURITY_PIN;
  }
};

const savePin = (pin) => {
  try {
    localStorage.setItem(PIN_STORAGE_KEY, pin);
  } catch (err) {
    console.error("Failed saving security pin:", err);
  }
};

export const authService = {
  syncOnlineOfficers: async () => {
    try {
      const res = await fetch('/api/officers');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const currentUsers = loadUsers();
          const adminUsers = currentUsers.filter(u => u.role === "ADMIN");

          const onlineOfficers = json.data.map((emp, idx) => {
            const cleanName = emp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const badge = emp.badgeNumber || `KSP-${emp.ROWID}`;
            const photoUrl = OFFICER_PHOTOS[idx % OFFICER_PHOTOS.length];
            const existing = currentUsers.find(u => u.id === `u-${emp.ROWID}` || u.badge === badge || u.name.toLowerCase() === emp.name.toLowerCase());
            return {
              id: `u-${emp.ROWID}`,
              username: existing?.username || `ksp.${cleanName}`,
              password: existing?.password || "Officer@123",
              name: emp.name,
              role: "OFFICER",
              rank: emp.rank || "Police Inspector",
              kgid: badge,
              badge: badge,
              unit: emp.unit || "State Range",
              avatar: photoUrl
            };
          });

          const synced = [...adminUsers, ...onlineOfficers];
          saveUsers(synced);
          return synced;
        }
      }
    } catch (err) {
      console.warn("[authService] Online officer sync failed:", err.message);
    }
    return loadUsers();
  },

  getCurrentUser: () => {
    return loadSession();
  },

  getUsers: () => {
    return loadUsers();
  },

  loginAdmin: async (username, password) => {
    const users = loadUsers();
    const cleanUsername = username.trim().toLowerCase();

    const user = users.find(
      (u) => u.username.toLowerCase() === cleanUsername && u.role === "ADMIN"
    );

    if (!user) {
      throw new Error("Invalid Admin ID or username.");
    }

    if (user.password !== password) {
      throw new Error("Incorrect Admin password.");
    }

    saveSession(user);
    return user;
  },

  loginOfficer: async (username, password) => {
    const users = loadUsers();
    const cleanUsername = username.trim().toLowerCase();

    const user = users.find(
      (u) => u.username.toLowerCase() === cleanUsername && u.role === "OFFICER"
    );

    if (!user) {
      throw new Error("Officer account not found for this username.");
    }

    if (user.password !== password) {
      throw new Error("Incorrect Officer password.");
    }

    saveSession(user);
    return user;
  },

  logout: () => {
    saveSession(null);
  },

  registerOfficerAccount: (officerData) => {
    const users = loadUsers();

    const { username, password, name, rank, badge, kgid, unit } = officerData;

    // Check username uniqueness
    const exists = users.some(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (exists) {
      throw new Error(`Username '${username}' is already in use by another user account.`);
    }

    const newUser = {
      id: `u-off-${Date.now()}`,
      username: username.trim(),
      password: password || "Officer@123",
      name: name || "Officer",
      role: "OFFICER",
      rank: rank || "PSI",
      kgid: kgid || badge || `KSP-${Date.now().toString().slice(-4)}`,
      badge: badge || kgid || `KSP-${Date.now().toString().slice(-4)}`,
      unit: unit || "General Range"
    };

    const updated = [...users, newUser];
    saveUsers(updated);
    return newUser;
  },

  updatePassword: (userId, newPassword) => {
    const users = loadUsers();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      throw new Error("User account not found.");
    }

    users[userIndex].password = newPassword;
    saveUsers(users);

    // If updating current active session user, update session as well
    const current = loadSession();
    if (current && current.id === userId) {
      current.password = newPassword;
      saveSession(current);
    }

    return users[userIndex];
  },

  updateUserProfile: (userId, profileData) => {
    const users = loadUsers();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      throw new Error("User account not found.");
    }

    // Check username uniqueness if changed
    if (profileData.username && profileData.username.trim().toLowerCase() !== users[userIndex].username.toLowerCase()) {
      const exists = users.some(
        (u) => u.id !== userId && u.username.toLowerCase() === profileData.username.trim().toLowerCase()
      );
      if (exists) {
        throw new Error(`Username '${profileData.username}' is already taken by another user.`);
      }
    }

    const updatedUser = {
      ...users[userIndex],
      name: profileData.name !== undefined ? profileData.name : users[userIndex].name,
      username: profileData.username !== undefined ? profileData.username.trim() : users[userIndex].username,
      phone: profileData.phone !== undefined ? profileData.phone : users[userIndex].phone,
      address: profileData.address !== undefined ? profileData.address : users[userIndex].address,
      avatar: profileData.avatar !== undefined ? profileData.avatar : users[userIndex].avatar,
      unit: profileData.unit !== undefined ? profileData.unit : users[userIndex].unit
    };

    if (profileData.password) {
      updatedUser.password = profileData.password;
    }

    users[userIndex] = updatedUser;
    saveUsers(users);

    // If updating current active session user, update session
    const current = loadSession();
    if (current && current.id === userId) {
      saveSession(updatedUser);
    }

    return updatedUser;
  },

  getSecurityPin: () => {
    return loadPin();
  },

  updateSecurityPin: (newPin) => {
    if (!newPin || newPin.trim().length < 4) {
      throw new Error("Security PIN must be at least 4 digits.");
    }
    const cleanPin = newPin.trim();
    savePin(cleanPin);
    return cleanPin;
  },

  verifyPin: (inputPin) => {
    const currentPin = loadPin();
    return String(inputPin).trim() === currentPin;
  }
};

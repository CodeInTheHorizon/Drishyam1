import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  // Default theme is explicitly 'dark'
  const [theme, setThemeState] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("ksp-theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      }
    } catch (e) {
      console.warn("Could not read theme from localStorage", e);
    }
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
      root.classList.add("light-theme");
      root.classList.remove("dark");
    } else {
      root.setAttribute("data-theme", "dark");
      root.classList.remove("light-theme");
      root.classList.add("dark");
    }

    try {
      localStorage.setItem("ksp-theme", theme);
    } catch (e) {
      console.warn("Could not save theme to localStorage", e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme) => {
    if (newTheme === "light" || newTheme === "dark") {
      setThemeState(newTheme);
    }
  };

  const value = {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === "dark",
    isLight: theme === "light",
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

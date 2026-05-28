import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem('eams_theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch { return 'light'; }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: getInitialTheme(),
    sidebarOpen: true,
    mobileSidebarOpen: false,
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('eams_theme', state.theme);
        if (state.theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      } catch {}
    },
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setMobileSidebar: (state, action) => { state.mobileSidebarOpen = action.payload; },
  },
});
export const { toggleTheme, toggleSidebar, setMobileSidebar } = uiSlice.actions;
export default uiSlice.reducer;

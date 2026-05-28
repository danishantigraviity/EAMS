import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';

const getInitialAuth = () => {
  try {
    const stored = sessionStorage.getItem('eams_auth');
    if (stored) return JSON.parse(stored);
  } catch {}
  return { user: null, accessToken: null, refreshToken: null };
};

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await authService.login(credentials);
    sessionStorage.setItem('eams_auth', JSON.stringify(data.data));
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await authService.register(userData);
    sessionStorage.setItem('eams_auth', JSON.stringify(data.data));
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const refreshToken = createAsyncThunk('auth/refresh', async (token, { rejectWithValue }) => {
  try {
    const { data } = await authService.refreshToken(token);
    const stored = JSON.parse(sessionStorage.getItem('eams_auth') || '{}');
    const updated = { ...stored, ...data.data };
    sessionStorage.setItem('eams_auth', JSON.stringify(updated));
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Token refresh failed');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { getState }) => {
  try {
    const { refreshToken } = getState().auth;
    if (refreshToken) await authService.logout(refreshToken);
  } catch {}
  sessionStorage.removeItem('eams_auth');
});

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const { exp } = JSON.parse(jsonPayload);
    return Date.now() >= (exp * 1000 - 10000); // 10s buffer
  } catch {
    return true;
  }
};

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const token = state.auth.accessToken;
    const refreshTokenVal = state.auth.refreshToken;

    if (isTokenExpired(token)) {
      if (!refreshTokenVal || isTokenExpired(refreshTokenVal)) {
        dispatch({ type: 'auth/logout' });
        return rejectWithValue('Token expired');
      }
      try {
        const result = await dispatch(refreshToken(refreshTokenVal));
        if (refreshToken.fulfilled.match(result)) {
          const { data } = await authService.getMe();
          return data.data;
        } else {
          dispatch({ type: 'auth/logout' });
          return rejectWithValue('Token refresh failed');
        }
      } catch {
        dispatch({ type: 'auth/logout' });
        return rejectWithValue('Token refresh failed');
      }
    }

    try {
      const { data } = await authService.getMe();
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
    }
  },
  {
    condition: (_, { getState }) => {
      const { auth } = getState();
      if (auth.verifying) {
        return false;
      }
    }
  }
);

const initial = getInitialAuth();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initial.user || null,
    accessToken: initial.accessToken || null,
    refreshToken: initial.refreshToken || null,
    loading: false,
    verifying: false,
    error: null,
    initialized: !initial.accessToken,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      sessionStorage.removeItem('eams_auth');
    },
    clearError: (state) => { state.error = null; },
    setInitialized: (state) => { state.initialized = true; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        if (action.payload.refreshToken) state.refreshToken = action.payload.refreshToken;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null; state.accessToken = null; state.refreshToken = null;
      })
      .addCase(getMe.pending, (state) => {
        state.verifying = true;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initialized = true;
        state.verifying = false;
      })
      .addCase(getMe.rejected, (state) => {
        state.initialized = true;
        state.verifying = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      })
  },
});

export const { logout, clearError, setInitialized } = authSlice.actions;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => !!state.auth.accessToken && !!state.auth.user;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export default authSlice.reducer;

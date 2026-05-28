import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../../services/notificationService';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, { rejectWithValue }) => {
  try { const { data } = await notificationService.getMyNotifications(); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
export const markRead = createAsyncThunk('notifications/markRead', async (id, { rejectWithValue }) => {
  try { await notificationService.markAsRead(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
export const markAllRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try { await notificationService.markAllAsRead(); return true; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0, loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (s, a) => { s.items = a.payload.data; s.unreadCount = a.payload.unreadCount; })
      .addCase(markRead.fulfilled, (s, a) => { const n = s.items.find(i => i._id === a.payload); if (n && !n.isRead) { n.isRead = true; s.unreadCount = Math.max(0, s.unreadCount - 1); } })
      .addCase(markAllRead.fulfilled, (s) => { s.items.forEach(n => { n.isRead = true; }); s.unreadCount = 0; });
  },
});
export default notificationSlice.reducer;

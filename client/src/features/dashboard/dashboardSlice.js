import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardService } from '../../services/dashboardService';

export const fetchDashboardStats = createAsyncThunk('dashboard/fetchStats', async (_, { rejectWithValue }) => {
  try { const { data } = await dashboardService.getStats(); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { stats: null, loading: false, error: null, lastFetched: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDashboardStats.fulfilled, (s, a) => { s.loading = false; s.stats = a.payload; s.lastFetched = Date.now(); })
      .addCase(fetchDashboardStats.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  },
});
export default dashboardSlice.reducer;

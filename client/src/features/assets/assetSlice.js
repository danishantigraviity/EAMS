import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { assetService } from '../../services/assetService';

export const fetchAssets = createAsyncThunk('assets/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await assetService.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch assets'); }
});
export const fetchAsset = createAsyncThunk('assets/fetchOne', async (id, { rejectWithValue }) => {
  try { const { data } = await assetService.getById(id); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
export const createAsset = createAsyncThunk('assets/create', async (formData, { rejectWithValue }) => {
  try { const { data } = await assetService.create(formData); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
export const updateAsset = createAsyncThunk('assets/update', async ({ id, data: formData }, { rejectWithValue }) => {
  try { const { data } = await assetService.update(id, formData); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
export const deleteAsset = createAsyncThunk('assets/delete', async (id, { rejectWithValue }) => {
  try { await assetService.delete(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
export const assignAsset = createAsyncThunk('assets/assign', async ({ id, data: body }, { rejectWithValue }) => {
  try { const { data } = await assetService.assign(id, body); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
export const unassignAsset = createAsyncThunk('assets/unassign', async ({ id, data: body }, { rejectWithValue }) => {
  try { const { data } = await assetService.unassign(id, body); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
export const fetchAssetHistory = createAsyncThunk('assets/history', async (id, { rejectWithValue }) => {
  try { const { data } = await assetService.getHistory(id); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

const assetSlice = createSlice({
  name: 'assets',
  initialState: { items: [], current: null, history: [], total: 0, page: 1, totalPages: 1, loading: false, error: null },
  reducers: { clearCurrent: (state) => { state.current = null; state.history = []; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssets.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchAssets.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data; s.total = a.payload.total; s.page = a.payload.page; s.totalPages = a.payload.totalPages; })
      .addCase(fetchAssets.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchAsset.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(createAsset.fulfilled, (s, a) => { s.items.unshift(a.payload); s.total += 1; })
      .addCase(updateAsset.fulfilled, (s, a) => { const idx = s.items.findIndex(i => i._id === a.payload._id); if (idx !== -1) s.items[idx] = a.payload; if (s.current?._id === a.payload._id) s.current = a.payload; })
      .addCase(deleteAsset.fulfilled, (s, a) => { s.items = s.items.filter(i => i._id !== a.payload); })
      .addCase(assignAsset.fulfilled, (s, a) => { const idx = s.items.findIndex(i => i._id === a.payload._id); if (idx !== -1) s.items[idx] = a.payload; if (s.current?._id === a.payload._id) s.current = a.payload; })
      .addCase(unassignAsset.fulfilled, (s, a) => { const idx = s.items.findIndex(i => i._id === a.payload._id); if (idx !== -1) s.items[idx] = a.payload; if (s.current?._id === a.payload._id) s.current = a.payload; })
      .addCase(fetchAssetHistory.fulfilled, (s, a) => { s.history = a.payload; });
  },
});
export const { clearCurrent } = assetSlice.actions;
export default assetSlice.reducer;

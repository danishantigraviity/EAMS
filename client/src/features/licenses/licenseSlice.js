import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { licenseService } from '../../services/licenseService';

export const fetchLicenses = createAsyncThunk('licenses/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await licenseService.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
export const createLicense = createAsyncThunk('licenses/create', async (body, { rejectWithValue }) => {
  try { const { data } = await licenseService.create(body); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
export const updateLicense = createAsyncThunk('licenses/update', async ({ id, data: body }, { rejectWithValue }) => {
  try { const { data } = await licenseService.update(id, body); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
export const deleteLicense = createAsyncThunk('licenses/delete', async (id, { rejectWithValue }) => {
  try { await licenseService.delete(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
export const assignSeat = createAsyncThunk('licenses/assignSeat', async ({ id, userId }, { rejectWithValue }) => {
  try { const { data } = await licenseService.assignSeat(id, userId); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
export const unassignSeat = createAsyncThunk('licenses/unassignSeat', async ({ id, userId }, { rejectWithValue }) => {
  try { const { data } = await licenseService.unassignSeat(id, userId); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

const licenseSlice = createSlice({
  name: 'licenses',
  initialState: { items: [], total: 0, page: 1, totalPages: 1, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLicenses.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchLicenses.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data; s.total = a.payload.total; s.page = a.payload.page; s.totalPages = a.payload.totalPages; })
      .addCase(fetchLicenses.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createLicense.fulfilled, (s, a) => { s.items.unshift(a.payload); })
      .addCase(updateLicense.fulfilled, (s, a) => { const idx = s.items.findIndex(i => i._id === a.payload._id); if (idx !== -1) s.items[idx] = a.payload; })
      .addCase(deleteLicense.fulfilled, (s, a) => { s.items = s.items.filter(i => i._id !== a.payload); })
      .addCase(assignSeat.fulfilled, (s, a) => { const idx = s.items.findIndex(i => i._id === a.payload._id); if (idx !== -1) s.items[idx] = a.payload; })
      .addCase(unassignSeat.fulfilled, (s, a) => { const idx = s.items.findIndex(i => i._id === a.payload._id); if (idx !== -1) s.items[idx] = a.payload; });
  },
});
export default licenseSlice.reducer;

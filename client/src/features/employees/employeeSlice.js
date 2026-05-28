import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { employeeService } from '../../services/employeeService';

export const fetchEmployees = createAsyncThunk('employees/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await employeeService.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
export const createEmployee = createAsyncThunk('employees/create', async (formData, { rejectWithValue }) => {
  try { const { data } = await employeeService.create(formData); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
export const updateEmployee = createAsyncThunk('employees/update', async ({ id, data: formData }, { rejectWithValue }) => {
  try { const { data } = await employeeService.update(id, formData); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
export const deleteEmployee = createAsyncThunk('employees/delete', async (id, { rejectWithValue }) => {
  try { await employeeService.delete(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

const employeeSlice = createSlice({
  name: 'employees',
  initialState: { items: [], total: 0, page: 1, totalPages: 1, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchEmployees.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data; s.total = a.payload.total; s.page = a.payload.page; s.totalPages = a.payload.totalPages; })
      .addCase(fetchEmployees.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createEmployee.fulfilled, (s, a) => { s.items.unshift(a.payload); })
      .addCase(updateEmployee.fulfilled, (s, a) => { const idx = s.items.findIndex(i => i._id === a.payload._id); if (idx !== -1) s.items[idx] = a.payload; })
      .addCase(deleteEmployee.fulfilled, (s, a) => { s.items = s.items.filter(i => i._id !== a.payload); });
  },
});
export default employeeSlice.reducer;

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import assetReducer from './features/assets/assetSlice';
import licenseReducer from './features/licenses/licenseSlice';
import employeeReducer from './features/employees/employeeSlice';
import notificationReducer from './features/notifications/notificationSlice';
import dashboardReducer from './features/dashboard/dashboardSlice';
import uiReducer from './features/ui/uiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    assets: assetReducer,
    licenses: licenseReducer,
    employees: employeeReducer,
    notifications: notificationReducer,
    dashboard: dashboardReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;

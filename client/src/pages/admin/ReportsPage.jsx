import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';
import { dashboardService } from '../../services/dashboardService';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/StatCard';

const COLORS = ['#5C6BC0', '#26A69A', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function ReportsPage() {
  const [assetReport, setAssetReport] = useState(null);
  const [mainReport, setMainReport] = useState(null);
  const [licReport, setLicReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [a, m, l] = await Promise.all([
          dashboardService.getAssetReport(),
          dashboardService.getMaintenanceReport(),
          dashboardService.getLicenseReport(),
        ]);
        setAssetReport(a.data.data);
        setMainReport(m.data.data);
        setLicReport(l.data.data);
      } catch { toast.error('Failed to load reports'); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const exportAssetExcel = () => {
    const ws = XLSX.utils.json_to_sheet([
      ...((assetReport?.byType || []).map(r => ({ Category: 'By Type', Name: r._id, Count: r.count }))),
      ...((assetReport?.byStatus || []).map(r => ({ Category: 'By Status', Name: r._id, Count: r.count }))),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asset Report');
    XLSX.writeFile(wb, `asset-report-${format(new Date(), 'yyyyMMdd')}.xlsx`);
    toast.success('Exported!');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('EAMS Asset Report', 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 28);

    if (assetReport?.byType?.length) {
      doc.autoTable({
        startY: 38,
        head: [['Asset Type', 'Count']],
        body: assetReport.byType.map(r => [r._id, r.count]),
        headStyles: { fillColor: [92, 107, 192] },
      });
    }
    doc.save(`asset-report-${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success('PDF exported!');
  };

  const byTypeData = (assetReport?.byType || []).map(r => ({ name: r._id, value: r.count }));
  const byStatusData = (assetReport?.byStatus || []).map(r => ({ name: r._id, value: r.count }));
  const byVendorData = (licReport?.byVendor || []).map(r => ({ name: r._id, cost: r.totalCost, count: r.count }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900 dark:text-white">Reports & Analytics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Comprehensive asset and operational insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Download} onClick={exportAssetExcel}>Export Excel</Button>
          <Button variant="secondary" icon={Download} onClick={exportPDF}>Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets by Type */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <h3 className="font-bold font-heading text-gray-900 dark:text-white mb-4">Assets by Type</h3>
          {loading ? <Skeleton className="h-56 w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {byTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Assets by Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <h3 className="font-bold font-heading text-gray-900 dark:text-white mb-4">Assets by Status</h3>
          {loading ? <Skeleton className="h-56 w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {byStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Maintenance Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6">
          <h3 className="font-bold font-heading text-gray-900 dark:text-white mb-4">Maintenance Summary</h3>
          {loading ? <Skeleton className="h-48 w-full" /> : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {(mainReport?.byStatus || []).map(s => (
                  <div key={s._id} className="card p-4 text-center">
                    <p className="text-2xl font-bold font-heading text-gray-900 dark:text-white">{s.count}</p>
                    <p className="text-sm text-gray-500 capitalize">{s._id?.replace('-', ' ')}</p>
                  </div>
                ))}
              </div>
              {mainReport?.avgResolutionHours > 0 && (
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary-600 font-heading">{Math.round(mainReport.avgResolutionHours)}h</p>
                  <p className="text-sm text-gray-500">Average Resolution Time</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* License Cost by Vendor */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
          <h3 className="font-bold font-heading text-gray-900 dark:text-white mb-4">License Cost by Vendor</h3>
          {loading ? <Skeleton className="h-56 w-full" /> : byVendorData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No license data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byVendorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip formatter={(val) => [`₹${val.toLocaleString()}`, 'Cost']} />
                <Bar dataKey="cost" fill="#26A69A" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  );
}

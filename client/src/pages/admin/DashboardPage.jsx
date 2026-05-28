import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import {
  Package, Users, CheckCircle, AlertTriangle, Wrench, Shield, TrendingUp, Activity,
  FileText, BarChart3, Clock, Download, Check, X, Send, RefreshCw,
} from 'lucide-react';
import { fetchDashboardStats } from '../../features/dashboard/dashboardSlice';
import { StatCard } from '../../components/ui/StatCard';
import { Skeleton } from '../../components/ui/StatCard';
import Badge, { AssetStatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';

// Services for Quick Actions
import { assetRequestService } from '../../services/assetRequestService';
import { maintenanceService } from '../../services/maintenanceService';
import { assetService } from '../../services/assetService';
import { employeeService } from '../../services/employeeService';
import { dashboardService } from '../../services/dashboardService';

// UI Components
import AssetTypeDropdown from '../../components/ui/AssetTypeDropdown';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Button from '../../components/ui/Button';

// Utilities for Reports Export
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';
import websocketService from '../../services/websocketService';

const STATUS_COLORS = {
  available: '#26A69A', assigned: '#5C6BC0', damaged: '#ef4444', maintenance: '#f59e0b', retired: '#6b7280',
};
const CHART_COLORS = ['#5C6BC0', '#26A69A', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white dark:bg-dark-700 border border-gray-100 dark:border-dark-600 rounded-xl shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector(s => s.dashboard);

  // Quick Actions Tab State
  const [activeActionTab, setActiveActionTab] = useState('requests');

  // Requests Tab States
  const [allRequests, setAllRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [reviewingReqId, setReviewingReqId] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewNotes, setReviewNotes] = useState('');

  // Reports Tab States
  const [reportsData, setReportsData] = useState({ assetReport: null, maintenanceReport: null, licReport: null });
  const [reportsLoading, setReportsLoading] = useState(false);

  // Request Asset Tab States
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [reqAssetType, setReqAssetType] = useState('');
  const [reqCustomAssetType, setReqCustomAssetType] = useState('');
  const [reqUrgency, setReqUrgency] = useState('medium');
  const [reqDescription, setReqDescription] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Report Issue Tab States
  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [issueAsset, setIssueAsset] = useState('');
  const [issuePriority, setIssuePriority] = useState('medium');
  const [issueDesc, setIssueDesc] = useState('');
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Initial dashboard load
  useEffect(() => { dispatch(fetchDashboardStats()); }, [dispatch]);

  // Live WebSocket Updates
  useEffect(() => {
    websocketService.connect();

    const unsubAssets = websocketService.subscribe('assets_update', (payload) => {
      console.log('🔄 Live asset update received:', payload);
      dispatch(fetchDashboardStats());
      if (activeActionTab === 'report-issue') {
        fetchAssets();
      }
      if (activeActionTab === 'reports') {
        fetchReportsData();
      }
    });

    const unsubRequests = websocketService.subscribe('requests_update', (payload) => {
      console.log('🔄 Live request update received:', payload);
      dispatch(fetchDashboardStats());
      if (activeActionTab === 'requests') {
        fetchAllRequests();
      }
    });

    const unsubMaintenance = websocketService.subscribe('maintenance_update', (payload) => {
      console.log('🔄 Live maintenance update received:', payload);
      dispatch(fetchDashboardStats());
      if (activeActionTab === 'reports') {
        fetchReportsData();
      }
    });

    return () => {
      unsubAssets();
      unsubRequests();
      unsubMaintenance();
    };
  }, [dispatch, activeActionTab]);

  // Conditional Data Fetcher based on Active Tab
  useEffect(() => {
    if (activeActionTab === 'requests') {
      fetchAllRequests();
    } else if (activeActionTab === 'reports') {
      if (!reportsData.assetReport) fetchReportsData();
    } else if (activeActionTab === 'request-asset') {
      if (employees.length === 0) fetchEmployees();
    } else if (activeActionTab === 'report-issue') {
      if (assets.length === 0) fetchAssets();
    }
  }, [activeActionTab]);

  // Request Fetches
  const fetchAllRequests = async () => {
    setRequestsLoading(true);
    try {
      const { data } = await assetRequestService.getAll({ limit: 10 });
      setAllRequests(data.data || []);
      setPendingRequests((data.data || []).filter(r => r.status === 'pending'));
    } catch (err) {
      console.error('Failed to load asset requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchReportsData = async () => {
    setReportsLoading(true);
    try {
      const [a, m, l] = await Promise.all([
        dashboardService.getAssetReport(),
        dashboardService.getMaintenanceReport(),
        dashboardService.getLicenseReport(),
      ]);
      setReportsData({
        assetReport: a.data.data,
        maintenanceReport: m.data.data,
        licReport: l.data.data,
      });
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const { data } = await employeeService.getAll({ limit: 100 });
      setEmployees(data.data || []);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const fetchAssets = async () => {
    setAssetsLoading(true);
    try {
      const { data } = await assetService.getAll({ limit: 100 });
      setAssets(data.data || []);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setAssetsLoading(false);
    }
  };

  const submitRequestReview = async (id) => {
    setRequestsLoading(true);
    try {
      await assetRequestService.update(id, { status: reviewStatus, reviewNotes });
      toast.success(`Request ${reviewStatus} successfully!`);
      setReviewingReqId(null);
      await fetchAllRequests();
      dispatch(fetchDashboardStats());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update request');
    } finally {
      setRequestsLoading(false);
    }
  };

  // Options mapping
  const assetOptions = assets.map(asset => ({
    value: asset._id,
    label: asset.name,
    description: `S/N: ${asset.serialNumber || 'N/A'} | Status: ${asset.status}`,
    icon: Package
  }));

  // Render Functions for Tabs
  const renderRequestsTab = () => {
    const pending = pendingRequests;
    const reviewed = allRequests.filter(r => r.status !== 'pending');

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Pending Asset Requests</h4>
            <p className="text-xs text-gray-500">Review and approve employee requests for new hardware</p>
          </div>
        </div>

        {requestsLoading && !reviewingReqId ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : pending.length === 0 ? (
          <div className="text-center py-6 text-gray-450 dark:text-gray-500">
            <CheckCircle size={28} className="mx-auto text-green-500 mb-2" />
            <p className="text-sm font-semibold">All caught up!</p>
            <p className="text-xs text-gray-400">No pending asset requests to review.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(req => {
              const isReviewing = reviewingReqId === req._id;
              
              return (
                <div 
                  key={req._id} 
                  className={`border border-gray-100 dark:border-dark-700/80 rounded-xl p-4 transition-all bg-white dark:bg-dark-800 ${isReviewing ? 'ring-2 ring-primary-500/20' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                          {req.assetTypeName || req.assetType}
                        </span>
                        <Badge variant={req.urgency === 'high' ? 'danger' : req.urgency === 'medium' ? 'warning' : 'success'}>
                          {req.urgency}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{req.description}</p>
                      <p className="text-xxs text-gray-400">
                        Requested by <span className="font-medium text-gray-600 dark:text-gray-300">{req.requestedBy?.name || '—'}</span> ({req.requestedBy?.email}) · {req.createdAt ? formatDistanceToNow(new Date(req.createdAt), { addSuffix: true }) : ''}
                      </p>
                    </div>
                    
                    {!isReviewing && (
                      <div className="flex sm:flex-col gap-2 flex-shrink-0">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setReviewingReqId(req._id);
                            setReviewStatus('approved');
                            setReviewNotes('');
                          }}
                        >
                          Review Request
                        </Button>
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {isReviewing && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700/80 space-y-3 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="label text-xxs font-bold text-gray-400 uppercase mb-1">Review Decision *</label>
                            <SearchableSelect
                              value={reviewStatus}
                              onChange={setReviewStatus}
                              searchable={false}
                              options={[
                                { value: 'approved', label: 'Approve Request', description: 'Authorize and proceed' },
                                { value: 'rejected', label: 'Reject Request', description: 'Deny request with feedback' }
                              ]}
                              placeholder="Select decision..."
                            />
                          </div>
                          <div>
                            <label className="label text-xxs font-bold text-gray-400 uppercase">Reviewer Notes (Optional)</label>
                            <input 
                              type="text" 
                              value={reviewNotes} 
                              onChange={e => setReviewNotes(e.target.value)} 
                              placeholder="Feedback, approval comments, delivery details..."
                              className="input text-xs h-9 py-1"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            loading={requestsLoading}
                            onClick={() => submitRequestReview(req._id)}
                            className="flex-1"
                          >
                            Submit Decision
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => setReviewingReqId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* Recently Reviewed Section (Status Tracking) */}
        <div className="pt-4 border-t border-gray-100 dark:border-dark-700/50">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Status Tracking (Recent Decisions)</h4>
          <p className="text-xs text-gray-500 mb-3">Logs of recently approved or rejected employee requests</p>
          
          {reviewed.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">No recently processed requests</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {reviewed.map(req => (
                <div key={req._id} className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700/80 rounded-xl text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {req.assetTypeName || req.assetType}
                    </p>
                    <p className="text-xxs text-gray-400 truncate">
                      For {req.requestedBy?.name || '—'} · Notes: "{req.reviewNotes || 'None'}"
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : req.status === 'fulfilled' ? 'info' : 'gray'}>
                      {req.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReportsTab = () => {
    const assetReport = reportsData.assetReport;
    
    const handleExcelExport = () => {
      if (!assetReport) {
        toast.error('Reports data is not loaded yet');
        return;
      }
      const ws = XLSX.utils.json_to_sheet([
        ...((assetReport.byType || []).map(r => ({ Category: 'By Type', Name: r._id, Count: r.count }))),
        ...((assetReport.byStatus || []).map(r => ({ Category: 'By Status', Name: r._id, Count: r.count }))),
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Asset Report');
      XLSX.writeFile(wb, `asset-report-${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success('Excel Report downloaded!');
    };

    const handlePdfExport = () => {
      if (!assetReport) {
        toast.error('Reports data is not loaded yet');
        return;
      }
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('EAMS Asset Report Summary', 14, 20);
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

      if (assetReport.byType?.length) {
        doc.autoTable({
          startY: 38,
          head: [['Asset Type', 'Count']],
          body: assetReport.byType.map(r => [r._id, r.count]),
          headStyles: { fillColor: [92, 107, 192] },
        });
      }
      doc.save(`asset-report-${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success('PDF Report downloaded!');
    };

    return (
      <div className="space-y-5">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Reports & Analytics Exporter</h4>
          <p className="text-xs text-gray-500">Download report snapshots of EAMS assets and licensing</p>
        </div>

        {reportsLoading ? (
          <div className="space-y-3">
            <div className="skeleton h-24 rounded-xl" />
            <div className="skeleton h-12 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card bg-white dark:bg-dark-800 p-4 border border-gray-100 dark:border-dark-700/80 flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-xs text-gray-400 uppercase mb-2">Excel Sheet Report</h5>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">Export list of asset types, category aggregates, and statuses.</p>
                </div>
                <Button variant="secondary" icon={Download} onClick={handleExcelExport} className="w-full justify-center text-xs">
                  Export Excel (.xlsx)
                </Button>
              </div>

              <div className="card bg-white dark:bg-dark-800 p-4 border border-gray-100 dark:border-dark-700/80 flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-xs text-gray-400 uppercase mb-2">PDF Document Report</h5>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">Generate and save a visual document of type allocations.</p>
                </div>
                <Button variant="secondary" icon={Download} onClick={handlePdfExport} className="w-full justify-center text-xs">
                  Export PDF (.pdf)
                </Button>
              </div>
            </div>

            {assetReport && (
              <div className="bg-white dark:bg-dark-800 border border-gray-150 dark:border-dark-700/80 rounded-xl p-4">
                <h5 className="font-bold text-xs text-gray-900 dark:text-white mb-3">Quick Allocations Breakdown</h5>
                <div className="space-y-2">
                  {(assetReport.byType || []).slice(0, 4).map((type, i) => {
                    const total = (assetReport.byType || []).reduce((acc, curr) => acc + curr.count, 0) || 1;
                    const pct = Math.round((type.count / total) * 100);
                    return (
                      <div key={type._id} className="space-y-1">
                        <div className="flex justify-between text-xxs font-semibold">
                          <span className="text-gray-700 dark:text-gray-300">{type._id}</span>
                          <span className="text-gray-500">{type.count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-dark-700 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary-500 h-full rounded-full" 
                            style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <a 
                href="/reports" 
                className="text-xs text-primary-500 hover:text-primary-600 font-bold flex items-center gap-1"
              >
                View Full Reports & Analytics Dashboard &rarr;
              </a>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRequestAssetTab = () => {
    const handleRequestSubmit = async (e) => {
      e.preventDefault();
      if (!reqAssetType) {
        toast.error('Please select an asset type');
        return;
      }
      if (reqAssetType.toLowerCase() === 'other' && !reqCustomAssetType.trim()) {
        toast.error('Please enter the custom asset type name');
        return;
      }
      if (!reqDescription.trim()) {
        toast.error('Please enter a description');
        return;
      }

      setSubmittingRequest(true);
      try {
        await assetRequestService.create({
          assetType: reqAssetType,
          customAssetType: reqAssetType.toLowerCase() === 'other' ? reqCustomAssetType.trim() : undefined,
          description: reqDescription.trim(),
          urgency: reqUrgency,
        });
        toast.success('Asset request submitted successfully!');
        setReqAssetType('');
        setReqCustomAssetType('');
        setReqDescription('');
        setReqUrgency('medium');
        fetchAllRequests();
        dispatch(fetchDashboardStats());
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to submit request');
      } finally {
        setSubmittingRequest(false);
      }
    };

    return (
      <form onSubmit={handleRequestSubmit} className="space-y-4">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Create Asset Request</h4>
          <p className="text-xs text-gray-500">Submit request for hardware or software licenses</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label text-xxs font-bold text-gray-400 uppercase mb-1">Asset Type Needed *</label>
            <AssetTypeDropdown
              value={reqAssetType}
              onChange={val => {
                setReqAssetType(val);
                if (val.toLowerCase() !== 'other') {
                  setReqCustomAssetType('');
                }
              }}
              placeholder="Select type..."
            />
          </div>

          <div>
            <label className="label text-xxs font-bold text-gray-400 uppercase mb-1">Urgency Level *</label>
            <SearchableSelect
              value={reqUrgency}
              onChange={setReqUrgency}
              searchable={false}
              options={[
                { value: 'low', label: 'Low Urgency', description: 'Non-blocking, standard request' },
                { value: 'medium', label: 'Medium Urgency', description: 'Needed soon, moderate priority' },
                { value: 'high', label: 'High Urgency', description: 'Urgent, blocking current tasks' }
              ]}
              placeholder="Select urgency..."
            />
          </div>
        </div>

        <AnimatePresence>
          {reqAssetType.toLowerCase() === 'other' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden space-y-1"
            >
              <label className="label text-xxs font-bold text-gray-400 uppercase mb-1">Custom Asset Type Name *</label>
              <input
                type="text"
                value={reqCustomAssetType}
                onChange={(e) => setReqCustomAssetType(e.target.value)}
                placeholder="e.g. Graphic Tablet, Server Rack"
                className="input text-sm h-[42px]"
                required
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label className="label text-xxs font-bold text-gray-400 uppercase mb-1">Description / Purpose *</label>
          <textarea 
            value={reqDescription} 
            onChange={e => setReqDescription(e.target.value)} 
            rows={3} 
            className="input resize-none text-sm" 
            placeholder="Describe what the asset is needed for and any specifications..."
            required
          />
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            icon={Send} 
            loading={submittingRequest}
            className="w-full sm:w-auto px-6 font-semibold"
          >
            Submit Asset Request
          </Button>
        </div>
      </form>
    );
  };

  const renderReportIssueTab = () => {
    const handleIssueSubmit = async (e) => {
      e.preventDefault();
      if (!issueAsset) {
        toast.error('Please select an asset');
        return;
      }
      if (!issueDesc.trim()) {
        toast.error('Please enter the issue description');
        return;
      }

      setSubmittingIssue(true);
      try {
        const fd = new FormData();
        fd.append('assetId', issueAsset);
        fd.append('issue', issueDesc.trim());
        fd.append('priority', issuePriority);

        await maintenanceService.create(fd);
        toast.success('Maintenance issue reported!');
        setIssueAsset('');
        setIssueDesc('');
        setIssuePriority('medium');
        dispatch(fetchDashboardStats());
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to submit issue');
      } finally {
        setSubmittingIssue(false);
      }
    };

    return (
      <form onSubmit={handleIssueSubmit} className="space-y-4">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Report Maintenance Issue</h4>
          <p className="text-xs text-gray-500">Log a broken asset for servicing or IT troubleshooting</p>
        </div>

        {assetsLoading ? (
          <div className="skeleton h-12 rounded-xl" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label text-xxs font-bold text-gray-400 uppercase mb-1">Select Asset *</label>
              <SearchableSelect
                value={issueAsset}
                onChange={setIssueAsset}
                options={assetOptions}
                placeholder="Choose asset..."
              />
            </div>

            <div>
              <label className="label text-xxs font-bold text-gray-400 uppercase mb-1">Priority Level *</label>
              <SearchableSelect
                value={issuePriority}
                onChange={setIssuePriority}
                searchable={false}
                options={[
                  { value: 'low', label: 'Low Priority', description: 'Minor issue, asset still usable' },
                  { value: 'medium', label: 'Medium Priority', description: 'Affects usage, needs servicing' },
                  { value: 'high', label: 'High Priority', description: 'Critical failure, completely unusable' }
                ]}
                placeholder="Select priority..."
              />
            </div>
          </div>
        )}

        <div>
          <label className="label text-xxs font-bold text-gray-400 uppercase mb-1">Describe the Issue *</label>
          <textarea 
            value={issueDesc} 
            onChange={e => setIssueDesc(e.target.value)} 
            rows={3} 
            className="input resize-none text-sm" 
            placeholder="Describe what is wrong with the asset..."
            required
          />
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            icon={Send} 
            loading={submittingIssue}
            className="w-full sm:w-auto px-6 font-semibold"
          >
            Submit Maintenance Request
          </Button>
        </div>
      </form>
    );
  };

  const overview = stats?.overview || {};
  const statusData = Object.entries(stats?.assetsByStatus || {}).map(([name, value]) => ({ name, value }));
  const deptData = (stats?.assetsByDepartment || []).map(d => ({ name: d.name || 'Unknown', assets: d.count }));
  const priorityData = Object.entries(stats?.maintenanceByPriority || {}).map(([name, value]) => ({ name, value }));
  const monthlyData = (stats?.monthlyAssetGrowth || []).map(m => ({
    month: new Date(m._id.year, m._id.month - 1).toLocaleString('default', { month: 'short' }),
    assets: m.count,
  }));

  const statCards = [
    { label: 'Total Assets', value: overview.totalAssets, icon: Package, color: 'primary' },
    { label: 'Assigned', value: overview.assignedAssets, icon: CheckCircle, color: 'info' },
    { label: 'Available', value: overview.availableAssets, icon: TrendingUp, color: 'success' },
    { label: 'Damaged', value: overview.damagedAssets, icon: AlertTriangle, color: 'danger' },
    { label: 'Maintenance', value: overview.openMaintenanceRequests, icon: Wrench, color: 'warning' },
    { label: 'Expiring Licenses', value: overview.expiringLicenses, icon: Shield, color: 'warning' },
    { label: 'Total Employees', value: overview.totalEmployees, icon: Users, color: 'accent' },
    { label: 'Warranty Alerts', value: overview.expiringWarranties, icon: AlertTriangle, color: 'danger' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.slice(0, 8).map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard {...card} loading={loading} />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions Hub Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.15 }} 
        className="card p-5 bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-600 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-dark-700/80 pb-4 mb-5 gap-3">
          <div>
            <h3 className="font-bold text-lg font-heading text-gray-900 dark:text-white">Quick Actions Hub</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Perform common administrative tasks and track status</p>
          </div>
          {activeActionTab === 'requests' && (
            <button 
              onClick={fetchAllRequests} 
              className="px-2.5 py-1 text-gray-450 hover:text-primary-500 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw size={12} className={requestsLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { id: 'requests', label: 'Requests', icon: Clock, color: 'primary' },
            { id: 'reports', label: 'Reports', icon: BarChart3, color: 'info' },
            { id: 'request-asset', label: 'Request Asset', icon: FileText, color: 'success' },
            { id: 'report-issue', label: 'Report Issue', icon: AlertTriangle, color: 'warning' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeActionTab === tab.id;
            
            const activeClasses = {
              primary: 'bg-primary-50 border-primary-500 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400',
              info: 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400',
              success: 'bg-green-50 border-green-500 text-green-600 dark:bg-green-950/20 dark:text-green-400',
              warning: 'bg-amber-50 border-amber-500 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400',
            };

            const borderClasses = isActive 
              ? activeClasses[tab.color] 
              : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-700 text-gray-650 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-750/30 hover:border-gray-300 dark:hover:border-dark-600';

            return (
              <motion.button
                key={tab.id}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setReviewingReqId(null);
                  setActiveActionTab(tab.id);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 gap-1.5 h-20 ${borderClasses}`}
              >
                <Icon size={18} />
                <span className="text-xs font-bold font-heading">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="bg-gray-50/50 dark:bg-dark-900/10 rounded-2xl p-4 sm:p-5 border border-gray-100/80 dark:border-dark-750/80">
          {activeActionTab === 'requests' && renderRequestsTab()}
          {activeActionTab === 'reports' && renderReportsTab()}
          {activeActionTab === 'request-asset' && renderRequestAssetTab()}
          {activeActionTab === 'report-issue' && renderReportIssueTab()}
        </div>
      </motion.div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Status Donut */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white font-heading mb-4">Asset Status Breakdown</h3>
          {loading ? <Skeleton className="h-56 w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {statusData.map((entry, i) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || CHART_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(val) => <span className="text-sm capitalize text-gray-600 dark:text-gray-400">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Monthly Asset Growth */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white font-heading mb-4">Monthly Asset Growth</h3>
          {loading ? <Skeleton className="h-56 w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="assets" stroke="#5C6BC0" strokeWidth={3} dot={{ fill: '#5C6BC0', r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets by Department */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white font-heading mb-4">Assets by Department</h3>
          {loading ? <Skeleton className="h-56 w-full" /> : deptData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No department data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="assets" fill="#5C6BC0" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Maintenance by Priority */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white font-heading mb-4">Maintenance by Priority</h3>
          {loading ? <Skeleton className="h-56 w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={entry.name === 'high' ? '#ef4444' : entry.name === 'medium' ? '#f59e0b' : '#26A69A'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Recent Activity Feed */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={20} className="text-primary-500" />
          <h3 className="font-bold text-gray-900 dark:text-white font-heading">Recent Activity</h3>
        </div>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : (
          <div className="space-y-2">
            {(stats?.recentActivity || []).map((log, i) => (
              <motion.div
                key={log._id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-dark-600 last:border-0"
              >
                <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Activity size={14} className="text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                    <strong className="font-semibold">{log.userId?.name || 'System'}</strong> — {log.action}
                  </p>
                  <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</p>
                </div>
                <Badge variant="gray">{log.resource}</Badge>
              </motion.div>
            ))}
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-6">No recent activity</p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

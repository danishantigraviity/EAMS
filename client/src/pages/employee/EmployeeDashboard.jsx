import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, AlertTriangle, CheckCircle, Clock, FileText, Send, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import websocketService from '../../services/websocketService';
import { assetService } from '../../services/assetService';
import { maintenanceService } from '../../services/maintenanceService';
import { assetRequestService } from '../../services/assetRequestService';
import Badge, { AssetStatusBadge, PriorityBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Skeleton, EmptyState, StatCard } from '../../components/ui/StatCard';
import AssetTypeDropdown from '../../components/ui/AssetTypeDropdown';
import SearchableSelect from '../../components/ui/SearchableSelect';

export default function EmployeeDashboard() {
  const { user } = useSelector(s => s.auth);
  const [myAssets, setMyAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assetRequests, setAssetRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestModal, setRequestModal] = useState(false);
  const [complaintModal, setComplaintModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [issue, setIssue] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [assetType, setAssetType] = useState('');
  const [customAssetType, setCustomAssetType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('maintenance');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assetsRes, reqRes, assetReqRes] = await Promise.all([
        assetService.getAll({ assignedTo: user._id, limit: 50 }),
        maintenanceService.getAll({ limit: 10 }),
        assetRequestService.getAll({ limit: 10 }),
      ]);
      setMyAssets(assetsRes.data.data);
      setRequests(reqRes.data.data);
      setAssetRequests(assetReqRes.data.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      loadData();
    }
  }, [user]);

  // Live WebSocket Updates
  useEffect(() => {
    websocketService.connect();

    const unsubAssets = websocketService.subscribe('assets_update', (payload) => {
      console.log('🔄 Live asset update received:', payload);
      if (user?._id) {
        loadData();
      }
    });

    const unsubRequests = websocketService.subscribe('requests_update', (payload) => {
      console.log('🔄 Live request update received:', payload);
      if (user?._id) {
        loadData();
      }
    });

    const unsubMaintenance = websocketService.subscribe('maintenance_update', (payload) => {
      console.log('🔄 Live maintenance update received:', payload);
      if (user?._id) {
        loadData();
      }
    });

    return () => {
      unsubAssets();
      unsubRequests();
      unsubMaintenance();
    };
  }, [user]);

  // Clean form state when modal opens/closes
  useEffect(() => {
    if (!requestModal) {
      setAssetType('');
      setCustomAssetType('');
      setDescription('');
      setUrgency('medium');
    }
  }, [requestModal]);

  const submitComplaint = async () => {
    if (!selectedAsset || !issue) { toast.error('Please fill all fields'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('assetId', selectedAsset);
      fd.append('issue', issue);
      fd.append('priority', urgency);
      await maintenanceService.create(fd);
      toast.success('Complaint submitted!');
      setComplaintModal(false);
      setIssue('');
      // Reload maintenance requests
      const reqRes = await maintenanceService.getAll({ limit: 10 });
      setRequests(reqRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAssetRequest = async () => {
    if (!assetType) {
      toast.error('Please select an asset type');
      return;
    }
    if (assetType.toLowerCase() === 'other' && !customAssetType.trim()) {
      toast.error('Please enter the custom asset type name');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setSubmitting(true);
    try {
      await assetRequestService.create({
        assetType,
        customAssetType: assetType.toLowerCase() === 'other' ? customAssetType.trim() : undefined,
        description: description.trim(),
        urgency,
      });
      toast.success('Asset request submitted successfully!');
      setRequestModal(false);
      // Reload asset requests list
      const assetReqRes = await assetRequestService.getAll({ limit: 10 });
      setAssetRequests(assetReqRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit asset request');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = [
    { label: 'My Assets', value: myAssets.length, icon: Package, color: 'primary' },
    { label: 'Active', value: myAssets.filter(a => a.status === 'assigned').length, icon: CheckCircle, color: 'success' },
    { label: 'In Maintenance', value: myAssets.filter(a => a.status === 'maintenance').length, icon: AlertTriangle, color: 'warning' },
    {
      label: 'Open Requests',
      value: requests.filter(r => r.status === 'open').length + assetRequests.filter(r => r.status === 'pending').length,
      icon: Clock,
      color: 'info'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-heading text-gray-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Here's an overview of your assets and requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard {...s} loading={loading} />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5">
        <h3 className="font-bold font-heading text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button icon={FileText} onClick={() => setRequestModal(true)}>Request Asset</Button>
          <Button variant="secondary" icon={AlertTriangle} onClick={() => setComplaintModal(true)}>Report Issue</Button>
        </div>
      </motion.div>

      {/* My Assets */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-5">
        <h3 className="font-bold font-heading text-gray-900 dark:text-white mb-4">My Assets</h3>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
          </div>
        ) : myAssets.length === 0 ? (
          <EmptyState icon={Package} title="No assets assigned" description="Contact IT team to request assets." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {myAssets.map(asset => (
              <motion.div key={asset._id} whileHover={{ y: -2 }} className="card p-4 border border-gray-100 dark:border-dark-600">
                <div className="flex gap-3">
                  {asset.imageUrl ? (
                    <img src={asset.imageUrl} alt={asset.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package size={20} className="text-primary-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{asset.name}</p>
                    <p className="text-xs text-gray-400 truncate">{asset.serialNumber}</p>
                    <div className="mt-1.5"><AssetStatusBadge status={asset.status} /></div>
                  </div>
                </div>
                {asset.warrantyExpiry && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-600">
                    <p className="text-xs text-gray-400">
                      Warranty: <span className={`font-medium ${new Date(asset.warrantyExpiry) < new Date() ? 'text-red-500' : new Date(asset.warrantyExpiry) < new Date(Date.now() + 30 * 86400000) ? 'text-amber-500' : 'text-gray-600 dark:text-gray-300'}`}>
                        {format(new Date(asset.warrantyExpiry), 'dd MMM yyyy')}
                      </span>
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Requests Tabs & Lists */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5">
        <div className="flex border-b border-gray-100 dark:border-dark-750 mb-4 pb-1 overflow-x-auto gap-4">
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`pb-3 font-heading font-bold text-sm transition-all border-b-2 px-1 whitespace-nowrap ${
              activeTab === 'maintenance'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Maintenance Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('asset')}
            className={`pb-3 font-heading font-bold text-sm transition-all border-b-2 px-1 whitespace-nowrap ${
              activeTab === 'asset'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Asset Requests ({assetRequests.length})
          </button>
        </div>

        {activeTab === 'maintenance' ? (
          requests.length === 0 ? (
            <EmptyState icon={CheckCircle} title="No requests" description="You haven't submitted any maintenance requests." />
          ) : (
            <div className="space-y-2.5">
              {requests.map(req => (
                <div
                  key={req._id}
                  onClick={() => setSelectedRequest({ ...req, requestType: 'maintenance' })}
                  className="flex items-center justify-between gap-3 py-3 px-4 border border-gray-100 dark:border-dark-700/80 rounded-xl hover:bg-gray-50/70 dark:hover:bg-dark-750/30 cursor-pointer transition-all duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{req.issue}</p>
                    <p className="text-xs text-gray-400 mt-1">{req.assetId?.name} · {req.createdAt ? format(new Date(req.createdAt), 'dd MMM yyyy') : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={req.priority} />
                    <Badge variant={req.status === 'resolved' ? 'success' : req.status === 'in-progress' ? 'warning' : req.status === 'cancelled' ? 'gray' : 'danger'}>
                      {req.status?.replace(/-/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          assetRequests.length === 0 ? (
            <EmptyState icon={Clock} title="No requests" description="You haven't submitted any asset requests." />
          ) : (
            <div className="space-y-2.5">
              {assetRequests.map(req => (
                <div
                  key={req._id}
                  onClick={() => setSelectedRequest({ ...req, requestType: 'asset' })}
                  className="flex items-center justify-between gap-3 py-3 px-4 border border-gray-100 dark:border-dark-700/80 rounded-xl hover:bg-gray-50/70 dark:hover:bg-dark-750/30 cursor-pointer transition-all duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      Request for {req.assetTypeName || req.assetType}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{req.description} · {req.createdAt ? format(new Date(req.createdAt), 'dd MMM yyyy') : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={req.urgency} />
                    <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : req.status === 'fulfilled' ? 'info' : 'warning'}>
                      {req.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </motion.div>

      {/* View Request Details Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={selectedRequest?.requestType === 'maintenance' ? 'Maintenance Request Details' : 'Asset Request Details'}
        size="sm"
      >
        <div className="p-6 space-y-4">
          {selectedRequest?.requestType === 'maintenance' ? (
            <>
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Asset Info</span>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">
                  {selectedRequest.assetId?.name || '—'}
                </p>
                <p className="text-xs text-gray-400">
                  S/N: {selectedRequest.assetId?.serialNumber || '—'}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Issue Description</span>
                <p className="text-sm text-gray-700 dark:text-gray-350 bg-gray-50 dark:bg-dark-700/40 p-3 rounded-xl whitespace-pre-wrap">
                  {selectedRequest.issue}
                </p>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Priority</span>
                  <PriorityBadge priority={selectedRequest.priority} />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Status</span>
                  <Badge variant={selectedRequest.status === 'resolved' ? 'success' : selectedRequest.status === 'in-progress' ? 'warning' : selectedRequest.status === 'cancelled' ? 'gray' : 'danger'}>
                    {selectedRequest.status?.replace(/-/g, ' ')}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Date Submitted</span>
                <p className="text-sm text-gray-650 dark:text-gray-400">
                  {selectedRequest.createdAt ? format(new Date(selectedRequest.createdAt), 'dd MMM yyyy HH:mm') : '—'}
                </p>
              </div>

              {selectedRequest.status === 'resolved' && selectedRequest.resolvedAt && (
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Resolved On</span>
                  <p className="text-sm text-gray-650 dark:text-gray-400">
                    {format(new Date(selectedRequest.resolvedAt), 'dd MMM yyyy HH:mm')}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100 dark:border-dark-700">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Admin Reply / Action Notes</span>
                {selectedRequest.notes ? (
                  <div className="p-3 bg-primary-50/40 dark:bg-primary-950/15 border border-primary-100/70 dark:border-primary-900/30 rounded-xl">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedRequest.notes}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-450 italic">No notes or resolution report provided yet.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Requested Asset Type</span>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">
                  {selectedRequest?.assetTypeName || selectedRequest?.assetType || '—'}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Description</span>
                <p className="text-sm text-gray-700 dark:text-gray-350 bg-gray-50 dark:bg-dark-700/40 p-3 rounded-xl whitespace-pre-wrap">
                  {selectedRequest?.description}
                </p>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Urgency</span>
                  <PriorityBadge priority={selectedRequest?.urgency} />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Status</span>
                  <Badge variant={selectedRequest?.status === 'approved' ? 'success' : selectedRequest?.status === 'rejected' ? 'danger' : selectedRequest?.status === 'fulfilled' ? 'info' : 'warning'}>
                    {selectedRequest?.status}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Date Submitted</span>
                <p className="text-sm text-gray-650 dark:text-gray-400">
                  {selectedRequest?.createdAt ? format(new Date(selectedRequest.createdAt), 'dd MMM yyyy HH:mm') : '—'}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-dark-700">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Admin Reply / Review Notes</span>
                {selectedRequest?.reviewNotes ? (
                  <div className="p-3 bg-primary-50/40 dark:bg-primary-950/15 border border-primary-100/70 dark:border-primary-900/30 rounded-xl">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedRequest.reviewNotes}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-450 italic">No notes or review report provided yet.</p>
                )}
              </div>
            </>
          )}

          <div className="pt-2">
            <Button variant="secondary" onClick={() => setSelectedRequest(null)} className="w-full justify-center">
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Request Asset Modal */}
      <Modal isOpen={requestModal} onClose={() => setRequestModal(false)} title="Request New Asset" size="sm" overflowVisible={true}>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Asset Type Needed</label>
            <AssetTypeDropdown
              value={assetType}
              onChange={val => {
                setAssetType(val);
                if (val.toLowerCase() !== 'other') {
                  setCustomAssetType('');
                }
              }}
              placeholder="Select asset type..."
            />
          </div>

          <AnimatePresence>
            {assetType.toLowerCase() === 'other' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-1"
              >
                <label className="label">Custom Asset Type Name *</label>
                <input
                  type="text"
                  value={customAssetType}
                  onChange={(e) => setCustomAssetType(e.target.value)}
                  placeholder="e.g. VR Headset, 3D Printer"
                  className="input"
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="label">Urgency</label>
            <SearchableSelect
              value={urgency}
              onChange={setUrgency}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }
              ]}
              searchable={false}
              placeholder="Select urgency"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input resize-none" placeholder="Explain why you need this asset..." />
          </div>
          <div className="flex gap-3">
            <Button icon={Send} onClick={submitAssetRequest} loading={submitting} className="flex-1 justify-center">Submit Request</Button>
            <Button variant="secondary" onClick={() => setRequestModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Report Issue Modal */}
      <Modal isOpen={complaintModal} onClose={() => setComplaintModal(false)} title="Report an Issue" size="sm" overflowVisible={true}>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Select Asset</label>
            <SearchableSelect
              value={selectedAsset}
              onChange={setSelectedAsset}
              options={myAssets.map(a => ({
                value: a._id,
                label: `${a.name} — ${a.serialNumber}`
              }))}
              placeholder="Choose asset..."
            />
          </div>
          <div>
            <label className="label">Priority</label>
            <SearchableSelect
              value={urgency}
              onChange={setUrgency}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }
              ]}
              searchable={false}
              placeholder="Select priority"
            />
          </div>
          <div>
            <label className="label">Issue Description</label>
            <textarea value={issue} onChange={e => setIssue(e.target.value)} rows={3} className="input resize-none" placeholder="Describe the problem..." />
          </div>
          <div className="flex gap-3">
            <Button icon={Send} onClick={submitComplaint} loading={submitting} className="flex-1 justify-center">Submit Issue</Button>
            <Button variant="secondary" onClick={() => setComplaintModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}



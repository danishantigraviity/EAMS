import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Camera, X, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { assetService } from '../../services/assetService';
import Button from '../../components/ui/Button';
import { AssetStatusBadge } from '../../components/ui/Badge';

export default function QRScannerPage() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [scannedAsset, setScannedAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopScanner();
          await lookupAsset(decodedText);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      toast.error('Camera access denied or not available');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.stop(); } catch {}
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  const lookupAsset = async (qrData) => {
    setLoading(true);
    try {
      // Parse EAMS-{assetId}-{serialNumber} format
      const parts = qrData.split('-');
      if (parts.length < 2) throw new Error('Invalid QR format');

      const assetId = parts[1];
      let foundAsset = null;

      // 1. Try to find asset by ID if it's a valid 24-character hexadecimal ObjectId
      if (assetId && assetId.length === 24 && /^[0-9a-fA-F]{24}$/.test(assetId)) {
        try {
          const { data } = await assetService.getById(assetId);
          if (data.data) {
            foundAsset = data.data;
          }
        } catch (e) {
          // Fall back to serial number search
        }
      }

      // 2. If not found by ID, search by serial number
      if (!foundAsset) {
        const serialNumber = parts.slice(2).join('-');
        const searchVal = serialNumber || parts[1];
        const { data } = await assetService.getAll({ search: searchVal, limit: 1 });
        if (data.data?.length > 0) {
          foundAsset = data.data[0];
        }
      }

      if (foundAsset) {
        setScannedAsset(foundAsset);
        toast.success('Asset found!');
      } else {
        toast.error('Asset not found in system');
      }
    } catch {
      toast.error('Could not look up asset');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = async () => {
    if (!manualInput.trim()) return;
    await lookupAsset(manualInput.trim());
  };

  useEffect(() => { return () => { stopScanner(); }; }, []);

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h2 className="text-xl font-bold font-heading text-gray-900 dark:text-white">QR Scanner</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Scan an asset QR code to view details</p>
      </div>

      {/* Scanner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-4">
        <div id="qr-reader" className={`w-full ${scanning ? 'h-64' : 'h-0 overflow-hidden'} rounded-xl overflow-hidden`} />

        {!scanning ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center">
              <QrCode size={36} className="text-primary-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center">Point your camera at an asset QR code to scan</p>
            <Button icon={Camera} onClick={startScanner}>Start Scanner</Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button variant="danger" icon={X} onClick={stopScanner}>Stop Scanner</Button>
          </div>
        )}

        <div className="border-t border-gray-100 dark:border-dark-600 pt-4">
          <p className="text-sm text-gray-500 mb-2 text-center">Or enter QR data manually</p>
          <div className="flex gap-2">
            <input
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualLookup()}
              placeholder="EAMS-{assetId}-{serialNumber}"
              className="input flex-1 text-sm font-mono"
            />
            <Button onClick={handleManualLookup} loading={loading}>Lookup</Button>
          </div>
        </div>
      </motion.div>

      {/* Scanned Asset Result */}
      {scannedAsset && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex gap-4">
            {scannedAsset.imageUrl ? (
              <img src={scannedAsset.imageUrl} alt={scannedAsset.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package size={32} className="text-primary-500" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white font-heading">{scannedAsset.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{scannedAsset.type} · {scannedAsset.serialNumber}</p>
              <div className="mt-2"><AssetStatusBadge status={scannedAsset.status} /></div>
            </div>
          </div>
          <div className="mt-4 space-y-2 border-t border-gray-100 dark:border-dark-600 pt-4">
            {[
              { label: 'Vendor', value: scannedAsset.vendor },
              { label: 'Assigned To', value: scannedAsset.assignedTo?.name },
              { label: 'Department', value: scannedAsset.department?.name },
              { label: 'Warranty', value: scannedAsset.warrantyExpiry ? new Date(scannedAsset.warrantyExpiry).toLocaleDateString() : null },
            ].map(({ label, value }) => value && (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => navigate('/assets')} className="flex-1 justify-center">View All Assets</Button>
            <Button variant="secondary" onClick={() => setScannedAsset(null)}>Clear</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Upload, Download, Trash2, Eye, Tag, FileText,
  Image as Img, Film, File, Presentation, Megaphone, Code, Table, Sparkles,
  Folder, Coffee, Braces, Terminal, Copy, History, ArrowLeft, Loader2, AlertTriangle, FileCode
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { digitalAssetService } from '../../services/digitalAssetService';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { ConfirmDialog, EmptyState } from '../../components/ui/StatCard';
import FileUploader from '../../components/ui/FileUploader';
import DigitalAssetCategoryDropdown from '../../components/ui/DigitalAssetCategoryDropdown';

const fileIcon = (type, fileName = '') => {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || lowerName.endsWith('.7z')) {
    return <FolderOpen size={20} className="text-yellow-500" />;
  }
  if (type?.startsWith('image')) return <Img size={20} className="text-blue-500" />;
  if (type?.startsWith('video')) return <Film size={20} className="text-purple-500" />;
  if (type?.includes('pdf')) return <FileText size={20} className="text-red-500" />;
  return <File size={20} className="text-gray-500" />;
};

const getCodeIcon = (filePath) => {
  const ext = filePath.split('.').pop().toLowerCase();
  if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return <Code size={15} className="text-amber-500" />;
  if (['py'].includes(ext)) return <Terminal size={15} className="text-emerald-500" />;
  if (['java'].includes(ext)) return <Coffee size={15} className="text-orange-500" />;
  if (['json', 'yml', 'yaml'].includes(ext)) return <Braces size={15} className="text-purple-500" />;
  if (['html', 'css'].includes(ext)) return <FileCode size={15} className="text-cyan-500" />;
  return <File size={15} className="text-gray-400" />;
};

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function DigitalAssetsPage() {
  const { user } = useSelector(s => s.auth);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [previewModal, setPreviewModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Upload States
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('document');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [filterCat, setFilterCat] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [duplicateModal, setDuplicateModal] = useState(null);

  // Archive Explorer States
  const [selectedFileInZip, setSelectedFileInZip] = useState(null);
  const [zipFileContent, setZipFileContent] = useState('');
  const [zipFileLoading, setZipFileLoading] = useState(false);
  const [zipFilePreviewUrl, setZipFilePreviewUrl] = useState('');
  const [zipFileIsImage, setZipFileIsImage] = useState(false);

  const canDelete = ['super_admin', 'it_team'].includes(user?.role);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await digitalAssetService.getAll({ category: filterCat, limit: 50 });
      setFiles(data.data || []);
    } catch {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterCat]);

  const handleUpload = async (forceUpload = false) => {
    if (!file) {
      toast.error('Select a file');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', category);
      fd.append('tags', tags);
      fd.append('isPublic', isPublic);
      if (forceUpload) {
        fd.append('force', 'true');
      }

      const res = await digitalAssetService.upload(fd, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      toast.success(res.data.message || 'File uploaded successfully!');
      setUploadModal(false);
      setFile(null);
      setTags('');
      setDuplicateModal(null);
      load();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.duplicate) {
        setDuplicateModal(err.response.data);
      } else {
        toast.error(err.response?.data?.message || 'Upload failed');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (asset, versionToDownload = null) => {
    try {
      const { data } = await digitalAssetService.getDownloadUrl(asset._id);
      
      // Default to main fileUrl if backend returned nothing or matches Cloudinary signature
      let downloadUrl = data.data.downloadUrl || asset.fileUrl;
      
      if (versionToDownload) {
        downloadUrl = versionToDownload.fileUrl;
      }
      
      window.open(downloadUrl, '_blank');
      
      if (!versionToDownload) {
        // Increment download count locally
        setFiles(prev => prev.map(f => f._id === asset._id ? { ...f, downloadCount: f.downloadCount + 1 } : f));
      }
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDelete = async () => {
    try {
      await digitalAssetService.delete(deleteConfirm._id);
      toast.success('File deleted successfully');
      setDeleteConfirm(null);
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const viewFileInZip = async (filePath) => {
    setSelectedFileInZip(filePath);
    setZipFileLoading(true);
    setZipFileContent('');
    setZipFilePreviewUrl('');
    setZipFileIsImage(false);

    try {
      const { data } = await digitalAssetService.getPreviewFile(previewModal._id, filePath);
      if (data.isText) {
        setZipFileContent(data.content);
      } else if (data.isImage) {
        setZipFileIsImage(true);
        setZipFilePreviewUrl(data.fileUrl);
      } else {
        setZipFileContent('File type not supported for text previews.');
      }
    } catch {
      setZipFileContent('Failed to fetch file content.');
    } finally {
      setZipFileLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(zipFileContent);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900 dark:text-white">Digital Assets</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage, extract, and review files, code templates, and media</p>
        </div>
        <Button icon={Upload} onClick={() => setUploadModal(true)}>Upload File</Button>
      </div>

      {/* Filter */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <DigitalAssetCategoryDropdown
          value={filterCat}
          onChange={setFilterCat}
          placeholder="All Categories"
          className="w-56"
        />
        <Button variant="ghost" onClick={() => setFilterCat('')}>Clear</Button>
      </div>

      {/* File Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-2xl animate-pulse bg-gray-200 dark:bg-dark-700" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FolderOpen}
            title="No files found"
            description="Upload your first digital asset (documents, images, videos, or ZIP/RAR archives)."
            action={<Button icon={Upload} onClick={() => setUploadModal(true)}>Upload File</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map((f, i) => (
            <motion.div
              key={f._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              className="card p-4 group hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail */}
                <div className="h-28 bg-gray-50 dark:bg-dark-800 rounded-xl flex items-center justify-center mb-3 overflow-hidden border border-gray-100 dark:border-dark-700/50">
                  {f.fileType?.startsWith('image') ? (
                    <img src={f.fileUrl} alt={f.fileName} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      {fileIcon(f.fileType, f.originalName)}
                      <span className="text-xs text-gray-400 uppercase font-mono">
                        {f.originalName.split('.').pop() || 'FILE'}
                      </span>
                    </div>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate" title={f.originalName}>
                  {f.originalName}
                </h4>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-gray-400">{formatBytes(f.fileSize)}</p>
                  <span className="text-[9px] font-semibold bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded">
                    v{f.version}
                  </span>
                </div>
                {f.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {f.tags.slice(0, 2).map(t => (
                      <span key={t} className="text-[9px] bg-gray-100 dark:bg-dark-700/50 border border-gray-200/40 dark:border-dark-600/30 rounded px-1.5 py-0.5 text-gray-500 dark:text-gray-400">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1 mt-4 border-t border-gray-100 dark:border-dark-700 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setSelectedFileInZip(null);
                    setZipFileContent('');
                    setZipFilePreviewUrl('');
                    setZipFileIsImage(false);
                    setPreviewModal(f);
                  }}
                  className="flex-1 p-1.5 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg flex items-center justify-center transition-colors"
                  title="Preview"
                >
                  <Eye size={13} className="text-gray-500" />
                </button>
                <button
                  onClick={() => handleDownload(f)}
                  className="flex-1 p-1.5 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg flex items-center justify-center transition-colors"
                  title="Download"
                >
                  <Download size={13} className="text-primary-500" />
                </button>
                {canDelete && (
                  <button
                    onClick={() => setDeleteConfirm(f)}
                    className="flex-1 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg flex items-center justify-center transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} className="text-red-500" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={uploadModal} onClose={() => setUploadModal(false)} title="Upload File" size="md" scrollable={false}>
        <div className="flex flex-col h-full max-h-[85vh] overflow-hidden bg-gray-50/20 dark:bg-dark-900/10">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 modal-scroll scrollbar-thin">
            <FileUploader
              onFileSelect={setFile}
              maxSize={50 * 1024 * 1024}
              accept={{
                'image/*': [],
                'application/pdf': [],
                'video/*': [],
                'application/zip': ['.zip'],
                'application/x-zip-compressed': ['.zip'],
                'application/x-rar-compressed': ['.rar'],
                'application/vnd.rar': ['.rar'],
                'application/x-7z-compressed': ['.7z'],
                'application/octet-stream': ['.zip', '.rar', '.7z'],
                'text/*': []
              }}
              hint="Supports Code Repositories (ZIP), PDFs, Templates, Images, and Videos up to 50MB"
              label="Drop file here or click to browse"
            />

            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-primary-600 dark:text-primary-400">
                  <span>Uploading file...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-dark-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Category *</label>
              <DigitalAssetCategoryDropdown
                value={category}
                onChange={setCategory}
                placeholder="Select category..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Tags (comma separated)</label>
              <input
                value={tags}
                onChange={e => setTags(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200/80 dark:border-dark-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                placeholder="e.g. react_src, python_bot, config"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
                className="rounded w-4 h-4 text-primary-600 focus:ring-primary-500/30 border-gray-300 dark:border-dark-700"
              />
              <label htmlFor="isPublic" className="text-sm font-medium text-gray-600 dark:text-gray-400 select-none">Make this file visible to all users</label>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800 flex-shrink-0">
            <Button
              variant="secondary"
              onClick={() => setUploadModal(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#F8F9FC] border border-gray-200/80 hover:bg-[#F1F3F9] dark:bg-dark-900/40 dark:border-dark-700 dark:hover:bg-dark-900/60 text-gray-700 dark:text-gray-300 transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleUpload(false)}
              loading={uploading}
              icon={Upload}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold !bg-primary-600 hover:!bg-primary-700 text-white shadow-md shadow-primary-500/20 hover:shadow-lg transition-all"
            >
              Upload
            </Button>
          </div>
        </div>
      </Modal>

      {/* Duplicate Alert Modal */}
      <ConfirmDialog
        isOpen={!!duplicateModal}
        onClose={() => setDuplicateModal(null)}
        onConfirm={() => handleUpload(true)}
        title="Duplicate File Detected"
        message="An identical file with the exact same name and size already exists in your digital assets vault. Would you like to overwrite it and upload it as a new version?"
        confirmLabel="Overwrite as New Version"
        variant="warning"
      />

      {/* Preview & Repository Explorer Modal */}
      <Modal
        isOpen={!!previewModal}
        onClose={() => setPreviewModal(null)}
        title={previewModal?.originalName}
        size={previewModal?.extractedFiles?.length > 0 ? 'xl' : 'lg'}
      >
        {previewModal && (
          <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto scrollbar-thin">
            {/* Archive Project Explorer vs Normal File Preview */}
            {previewModal.extractedFiles?.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">Repository Archive</Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Contains {previewModal.extractedFiles.filter(f => !f.isDirectory).length} files
                    </span>
                  </div>
                  <Button icon={Download} onClick={() => handleDownload(previewModal)}>Download ZIP</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-gray-200 dark:border-dark-700 rounded-2xl overflow-hidden h-[420px] bg-white dark:bg-dark-900 shadow-sm">
                  {/* Left Column: File Tree Explorer */}
                  <div className="md:col-span-4 border-r border-gray-100 dark:border-dark-800 overflow-y-auto p-3 bg-gray-50/50 dark:bg-dark-900/50 scrollbar-thin">
                    <div className="font-semibold text-xs text-gray-400 uppercase tracking-wider px-2.5 mb-2.5">
                      Archive Tree
                    </div>
                    <div className="space-y-0.5">
                      {(() => {
                        const sorted = [...previewModal.extractedFiles].sort((a, b) => a.path.localeCompare(b.path));
                        return sorted.map((item) => {
                          const parts = item.path.split('/');
                          const name = parts[parts.length - 1] || parts[parts.length - 2];
                          const depth = parts.length - (item.isDirectory ? 2 : 1);
                          const isSelected = selectedFileInZip === item.path;

                          return (
                            <button
                              key={item.path}
                              onClick={() => !item.isDirectory && viewFileInZip(item.path)}
                              style={{ paddingLeft: `${Math.max(8, depth * 14)}px` }}
                              className={`w-full flex items-center gap-2 text-left py-1.5 px-2 rounded-lg text-xs transition-colors ${
                                item.isDirectory
                                  ? 'text-gray-500 dark:text-gray-400 font-medium cursor-default'
                                  : isSelected
                                    ? 'bg-primary-500 text-white font-semibold'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-primary-600 dark:hover:text-primary-400'
                              }`}
                            >
                              {item.isDirectory ? (
                                <Folder size={14} className="text-yellow-500 shrink-0" />
                              ) : (
                                getCodeIcon(item.path)
                              )}
                              <span className="truncate">{name}</span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Right Column: Code Viewer / Editor Preview */}
                  <div className="md:col-span-8 overflow-y-auto flex flex-col justify-between bg-dark-950 text-gray-100 scrollbar-thin relative min-h-[300px]">
                    {selectedFileInZip ? (
                      zipFileLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3">
                          <Loader2 className="animate-spin text-primary-500" size={32} />
                          <span className="text-sm text-gray-400">Loading code contents...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col h-full">
                          {/* File Content Header bar */}
                          <div className="bg-dark-900 border-b border-dark-800 px-4 py-2 flex items-center justify-between text-xs sticky top-0 z-10">
                            <span className="font-mono text-gray-400 truncate max-w-[70%]">{selectedFileInZip}</span>
                            {zipFileContent && (
                              <button
                                onClick={handleCopyCode}
                                className="flex items-center gap-1.5 px-2 py-1 bg-dark-800 hover:bg-dark-700 transition-colors rounded text-gray-300 font-medium"
                              >
                                <Copy size={11} />
                                <span>Copy</span>
                              </button>
                            )}
                          </div>

                          {/* Preview container */}
                          <div className="p-4 font-mono text-xs overflow-x-auto flex-1 bg-dark-950">
                            {zipFileIsImage ? (
                              <div className="flex items-center justify-center py-6 h-full">
                                <img src={zipFilePreviewUrl} alt="Zip Preview" className="max-h-72 rounded-xl object-contain border border-dark-800" />
                              </div>
                            ) : (
                              <pre className="whitespace-pre scrollbar-thin leading-relaxed">
                                <code>{zipFileContent}</code>
                              </pre>
                            )}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
                        <div className="w-12 h-12 bg-dark-900 rounded-2xl flex items-center justify-center">
                          <Code size={20} className="text-primary-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-300">Repository Code Previewer</p>
                          <p className="text-xs text-gray-500 mt-1 max-w-[280px]">Select any source code file on the left to read its contents directly.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Standard File Preview
              <div className="space-y-4">
                {previewModal.fileType?.startsWith('image') ? (
                  <img src={previewModal.fileUrl} alt={previewModal.originalName} className="w-full rounded-2xl max-h-80 object-contain bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-dark-700/50" />
                ) : previewModal.fileType?.includes('pdf') ? (
                  <iframe src={previewModal.fileUrl} className="w-full h-80 rounded-2xl border border-gray-200 dark:border-dark-600" title="PDF Preview" />
                ) : (
                  <div className="flex flex-col items-center py-12 gap-3 bg-gray-50 dark:bg-dark-800 rounded-2xl border border-dashed border-gray-200 dark:border-dark-700">
                    {fileIcon(previewModal.fileType, previewModal.originalName)}
                    <p className="text-gray-400 text-sm">Preview not supported for this file type</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 dark:bg-dark-800 p-4 rounded-2xl border border-gray-100 dark:border-dark-700/40">
                  {[
                    { label: 'Size', value: formatBytes(previewModal.fileSize) },
                    { label: 'Type', value: previewModal.fileType },
                    { label: 'Category', value: previewModal.category },
                    { label: 'Version', value: `v${previewModal.version}` },
                    { label: 'Uploaded by', value: previewModal.uploadedBy?.name || 'Unknown' },
                    { label: 'Date', value: previewModal.createdAt ? format(new Date(previewModal.createdAt), 'dd MMM yyyy') : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-1.5">
                      <span className="text-gray-400 font-medium">{label}: </span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{value}</span>
                    </div>
                  ))}
                </div>
                <Button icon={Download} onClick={() => handleDownload(previewModal)} className="w-full justify-center">Download File</Button>
              </div>
            )}

            {/* Version Control Logs tab */}
            {previewModal.versionHistory?.length > 0 && (
              <div className="pt-4 border-t border-gray-100 dark:border-dark-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                  <History size={13} />
                  <span>Version History Logs ({previewModal.versionHistory.length + 1})</span>
                </div>
                <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin">
                  {/* Current Active Version */}
                  <div className="flex items-center justify-between p-3 bg-primary-500/10 dark:bg-primary-950/20 border border-primary-500/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-bold text-primary-600 dark:text-primary-400 font-mono">v{previewModal.version}</div>
                      <div>
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200">Current active file</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{formatBytes(previewModal.fileSize)} • Updated {format(new Date(previewModal.updatedAt || previewModal.createdAt), 'dd MMM yyyy HH:mm')}</div>
                      </div>
                    </div>
                    <Badge variant="primary">Active</Badge>
                  </div>

                  {/* Previous Historical Versions */}
                  {[...previewModal.versionHistory].reverse().map((oldVer) => (
                    <div key={oldVer._id || oldVer.version} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-800/50 border border-gray-200/50 dark:border-dark-700/50 rounded-xl hover:border-gray-300 dark:hover:border-dark-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-bold text-gray-400 font-mono">v{oldVer.version}</div>
                        <div>
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[200px]" title={oldVer.originalName}>
                            {oldVer.originalName}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {formatBytes(oldVer.fileSize)} • Uploaded {format(new Date(oldVer.createdAt), 'dd MMM yyyy HH:mm')}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(previewModal, oldVer)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors"
                        title="Download old version"
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete File" message={`Are you sure you want to permanently delete "${deleteConfirm?.originalName}"? This will delete all historical versions and any extracted folders from storage.`} confirmLabel="Delete" />
    </div>
  );
}

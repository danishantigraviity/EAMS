import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Laptop, Monitor, Tv, Armchair, Table, Printer, Wifi, Cctv,
  Smartphone, Keyboard, Mouse, Cpu, Server, Projector,
  Phone, Tablet, HelpCircle, Package, Check, ChevronDown, X, Search, Clock, Loader2,
  Edit3, Trash2, Plus, AlertCircle
} from 'lucide-react';
import { assetTypeService } from '../../services/assetTypeService';

const iconMap = {
  Laptop, Monitor, Tv, Chair: Armchair, Table, Printer, Wifi, Cctv,
  Smartphone, Keyboard, Mouse, Cpu, Server, Projector,
  Phone, Tablet, HelpCircle, Package
};

const AVAILABLE_ICONS = [
  { name: 'Laptop', label: 'Laptop' },
  { name: 'Monitor', label: 'Monitor' },
  { name: 'Tv', label: 'TV' },
  { name: 'Chair', label: 'Chair' },
  { name: 'Table', label: 'Table' },
  { name: 'Printer', label: 'Printer' },
  { name: 'Wifi', label: 'Wifi' },
  { name: 'Cctv', label: 'CCTV' },
  { name: 'Smartphone', label: 'Mobile' },
  { name: 'Keyboard', label: 'Keyboard' },
  { name: 'Mouse', label: 'Mouse' },
  { name: 'Cpu', label: 'UPS/CPU' },
  { name: 'Server', label: 'Server' },
  { name: 'Projector', label: 'Projector' },
  { name: 'Phone', label: 'Phone' },
  { name: 'Tablet', label: 'Tablet' },
  { name: 'HelpCircle', label: 'Other' }
];

const RECENT_KEY = 'eams_recent_asset_types';

export default function AssetTypeDropdown({
  value,
  onChange,
  placeholder = 'Select asset type...',
  isMulti = false,
  error = null,
  className = '',
  name = '',
  required = false
}) {
  const { user } = useSelector(s => s.auth);
  const canManage = ['super_admin', 'it_team'].includes(user?.role);

  const [isOpen, setIsOpen] = useState(false);
  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [recentCodes, setRecentCodes] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // CRUD Inline States
  const [formMode, setFormMode] = useState('list'); // 'list', 'add', 'edit'
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCategory, setNewCategory] = useState('IT Devices');
  const [newIcon, setNewIcon] = useState('Laptop');
  const [newDescription, setNewDescription] = useState('');
  const [crudLoading, setCrudLoading] = useState(false);
  const [crudError, setCrudError] = useState(null);

  const containerRef = useRef(null);
  const listRef = useRef(null);
  const searchInputRef = useRef(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch asset types
  const fetchTypes = async () => {
    setLoading(true);
    try {
      const { data } = await assetTypeService.getAll();
      setAssetTypes(data.data || []);
    } catch (err) {
      console.error('Failed to load asset types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  // Load recents
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
      setRecentCodes(saved);
    } catch {
      setRecentCodes([]);
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen && !isMobile) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, isMobile]);

  // Reset CRUD forms when dropdown toggles
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100);
    }
    if (!isOpen) {
      setSearch('');
      setFocusedIndex(-1);
      setFormMode('list');
      setEditingId(null);
      setCrudError(null);
    }
  }, [isOpen]);

  // Helper to render Lucide icon
  const renderIcon = (iconName, extraClass = '') => {
    const IconComp = iconMap[iconName] || iconMap.Package;
    return <IconComp className={`w-4 h-4 text-gray-500 dark:text-gray-400 ${extraClass}`} />;
  };

  // Filtered asset types
  const filteredTypes = useMemo(() => {
    if (!search.trim()) return assetTypes;
    return assetTypes.filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [assetTypes, search]);

  // Grouped options
  const groupedTypes = useMemo(() => {
    const groups = {};
    filteredTypes.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [filteredTypes]);

  // Recents items
  const recentItems = useMemo(() => {
    return assetTypes.filter((t) => recentCodes.includes(t.code));
  }, [assetTypes, recentCodes]);

  // Flat list for keyboard navigation
  const flatOptions = useMemo(() => {
    const list = [];
    if (recentItems.length > 0 && !search.trim()) {
      recentItems.forEach((item) => list.push({ ...item, isRecent: true }));
    }
    Object.keys(groupedTypes).forEach((cat) => {
      groupedTypes[cat].forEach((item) => list.push(item));
    });
    return list;
  }, [groupedTypes, recentItems, search]);

  // Scroll active keyboard-focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${focusedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  // Handle select / deselect
  const handleSelect = (typeCode) => {
    // Add to recent selections
    try {
      let rec = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
      rec = [typeCode, ...rec.filter((c) => c !== typeCode)].slice(0, 3);
      localStorage.setItem(RECENT_KEY, JSON.stringify(rec));
      setRecentCodes(rec);
    } catch (e) {
      console.error(e);
    }

    if (isMulti) {
      const currentVal = Array.isArray(value) ? value : [];
      if (currentVal.includes(typeCode)) {
        onChange(currentVal.filter((c) => c !== typeCode));
      } else {
        onChange([...currentVal, typeCode]);
      }
    } else {
      onChange(typeCode);
      setIsOpen(false);
    }
  };

  const removeMultiItem = (e, typeCode) => {
    e.stopPropagation();
    const currentVal = Array.isArray(value) ? value : [];
    onChange(currentVal.filter((c) => c !== typeCode));
  };

  // Keyboard controls
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (formMode !== 'list') return; // Disable dropdown keyboard list selection inside CRUD form

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < flatOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : flatOptions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < flatOptions.length) {
          handleSelect(flatOptions[focusedIndex].code);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Get display text/label for single selection
  const selectedLabel = useMemo(() => {
    if (isMulti) return '';
    const found = assetTypes.find((t) => t.code === value);
    return found ? found.name : '';
  }, [assetTypes, value, isMulti]);

  // Selected object array for multi-select
  const selectedObjects = useMemo(() => {
    if (!isMulti || !Array.isArray(value)) return [];
    return assetTypes.filter((t) => value.includes(t.code));
  }, [assetTypes, value, isMulti]);

  // Inline CRUD Handlers
  const startAdd = () => {
    setFormMode('add');
    setNewName('');
    setNewCode('');
    setNewCategory('IT Devices');
    setNewIcon('Laptop');
    setNewDescription('');
    setCrudError(null);
  };

  const startEdit = (e, item) => {
    e.stopPropagation();
    setFormMode('edit');
    setEditingId(item._id);
    setNewName(item.name);
    setNewCode(item.code);
    setNewCategory(item.category);
    setNewIcon(item.icon || 'Laptop');
    setNewDescription(item.description || '');
    setCrudError(null);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newCode.trim()) {
      setCrudError('Name and Code are required');
      return;
    }
    setCrudLoading(true);
    setCrudError(null);
    try {
      const res = await assetTypeService.create({
        name: newName,
        code: newCode,
        category: newCategory,
        icon: newIcon,
        description: newDescription
      });
      const newType = res.data.data;
      setAssetTypes((prev) => [...prev, newType]);
      handleSelect(newType.code);
      setFormMode('list');
    } catch (err) {
      setCrudError(err.response?.data?.message || 'Failed to create type');
    } finally {
      setCrudLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!newName.trim() || !newCode.trim()) {
      setCrudError('Name and Code are required');
      return;
    }
    setCrudLoading(true);
    setCrudError(null);
    try {
      const res = await assetTypeService.update(editingId, {
        name: newName,
        code: newCode,
        category: newCategory,
        icon: newIcon,
        description: newDescription
      });
      const updatedType = res.data.data;
      setAssetTypes((prev) => prev.map((t) => (t._id === editingId ? updatedType : t)));
      if (value === newCode || value === updatedType.code) {
        onChange(updatedType.code);
      }
      setFormMode('list');
      setEditingId(null);
    } catch (err) {
      setCrudError(err.response?.data?.message || 'Failed to update type');
    } finally {
      setCrudLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this asset type?')) return;
    setLoading(true);
    try {
      await assetTypeService.delete(id);
      const deleted = assetTypes.find((t) => t._id === id);
      setAssetTypes((prev) => prev.filter((t) => t._id !== id));
      if (deleted && value === deleted.code) {
        onChange('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete type. Ensure no active assets are using it.');
    } finally {
      setLoading(false);
    }
  };

  // Render Form Layout (Add/Edit)
  const renderCRUDForm = () => (
    <div className="p-4 space-y-3.5 overflow-y-auto max-h-[350px] scrollbar-thin">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-600/50 pb-2">
        <span className="font-bold text-sm text-gray-900 dark:text-white">
          {formMode === 'add' ? 'Add Asset Type' : 'Edit Asset Type'}
        </span>
        <button
          type="button"
          onClick={() => setFormMode('list')}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white font-medium"
        >
          Back to list
        </button>
      </div>

      {crudError && (
        <div className="p-2 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-xl text-xs flex items-center gap-1.5 border border-red-100 dark:border-red-950/50">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span className="line-clamp-2">{crudError}</span>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-xxs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Name *</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (formMode === 'add') {
                setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, ''));
              }
            }}
            placeholder="e.g. Wireless Mouse"
            className="w-full text-sm bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700/80 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
          />
        </div>

        <div>
          <label className="text-xxs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Code *</label>
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="e.g. wireless_mouse"
            className="w-full text-sm bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700/80 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 font-mono"
          />
        </div>

        <div>
          <label className="text-xxs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Category</label>
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="w-full text-sm bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700/80 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
          >
            <option value="IT Devices">IT Devices</option>
            <option value="Office Furniture">Office Furniture</option>
            <option value="Network Devices">Network Devices</option>
            <option value="Accessories">Accessories</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="text-xxs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Icon</label>
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-dark-600">
            {AVAILABLE_ICONS.map((ico) => {
              const IconComp = iconMap[ico.name] || iconMap.Package;
              const isSel = newIcon === ico.name;
              return (
                <button
                  key={ico.name}
                  type="button"
                  onClick={() => setNewIcon(ico.name)}
                  className={`p-2 rounded-lg border flex-shrink-0 flex items-center justify-center ${isSel
                      ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                      : 'bg-white dark:bg-dark-900 border-gray-200 dark:border-dark-700 text-gray-500 hover:border-primary-400'
                    }`}
                  title={ico.label}
                >
                  <IconComp size={16} />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xxs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Description</label>
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description..."
            rows={2}
            className="w-full text-sm bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700/80 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-dark-600/50 mt-1">
        <button
          type="button"
          disabled={crudLoading}
          onClick={formMode === 'add' ? handleCreate : handleUpdate}
          className="flex-1 py-2 bg-primary-500 text-white rounded-xl text-xs font-semibold hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
        >
          {crudLoading ? <Loader2 size={12} className="animate-spin" /> : null}
          <span>{formMode === 'add' ? 'Save Type' : 'Update Type'}</span>
        </button>
        <button
          type="button"
          onClick={() => setFormMode('list')}
          className="px-3.5 py-2 bg-gray-100 dark:bg-dark-750 text-gray-600 dark:text-gray-300 rounded-xl text-xs hover:bg-gray-200 dark:hover:bg-dark-700 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // Dropdown list JSX
  const renderDropdownList = () => {
    if (formMode !== 'list') {
      return renderCRUDForm();
    }

    return (
      <div className="flex flex-col h-full max-h-[350px] overflow-hidden">
        {/* Search Input */}
        <div className="p-3 border-b border-gray-100 dark:border-dark-600/50 flex items-center gap-2">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setFocusedIndex(-1);
            }}
            placeholder="Search types or categories..."
            className="w-full bg-transparent text-sm text-gray-900 dark:text-white border-0 outline-none focus:ring-0 p-0"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Options Scroll Container */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-dark-600 scrollbar-track-transparent py-2"
          role="listbox"
          aria-label="Asset Types"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 text-gray-400 text-sm gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
              <span>Loading types...</span>
            </div>
          ) : flatOptions.length === 0 ? (
            <div className="py-6 text-center text-gray-400 text-sm">
              No asset types found.
            </div>
          ) : (
            <>
              {/* Recent Selections Group */}
              {recentItems.length > 0 && !search.trim() && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xxs font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>Recent Selections</span>
                  </div>
                  {recentItems.map((item, idx) => {
                    const isFocused = idx === focusedIndex;
                    const isSelected = isMulti
                      ? Array.isArray(value) && value.includes(item.code)
                      : value === item.code;

                    return (
                      <button
                        key={`recent-${item.code}`}
                        type="button"
                        data-index={idx}
                        onClick={() => handleSelect(item.code)}
                        className={`group w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors ${isFocused
                            ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700/50'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {renderIcon(item.icon)}
                          <span>{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {canManage && (
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity mr-1">
                              <button
                                type="button"
                                onClick={(e) => startEdit(e, item)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded text-gray-400 hover:text-primary-500"
                                title="Edit Type"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDelete(e, item._id)}
                                className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded text-gray-400 hover:text-red-500"
                                title="Delete Type"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                          {isSelected && <Check size={16} className="text-primary-500 flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                  <div className="h-px bg-gray-100 dark:bg-dark-600/50 my-2 mx-3" />
                </div>
              )}

              {/* Categorized Groups */}
              {Object.keys(groupedTypes).map((category) => (
                <div key={category} className="mb-2">
                  <div className="px-3 py-1.5 text-xxs font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase">
                    {category}
                  </div>
                  {groupedTypes[category].map((item) => {
                    const flatIdx = flatOptions.findIndex((o) => o.code === item.code && !o.isRecent);
                    const isFocused = flatIdx === focusedIndex;
                    const isSelected = isMulti
                      ? Array.isArray(value) && value.includes(item.code)
                      : value === item.code;

                    return (
                      <button
                        key={item.code}
                        type="button"
                        data-index={flatIdx}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(item.code)}
                        className={`group w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors ${isFocused
                            ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700/50'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 mr-2 min-w-0 flex-1">
                          {renderIcon(item.icon, 'flex-shrink-0')}
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-medium truncate">{item.name}</span>
                            {item.description && (
                              <span className="text-xxs text-gray-400 dark:text-gray-500 truncate">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {canManage && (
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity mr-1">
                              <button
                                type="button"
                                onClick={(e) => startEdit(e, item)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded text-gray-400 hover:text-primary-500"
                                title="Edit Type"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDelete(e, item._id)}
                                className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded text-gray-400 hover:text-red-500"
                                title="Delete Type"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                          {isSelected && <Check size={16} className="text-primary-500 flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Add New Type Trigger Button */}
        {canManage && (
          <button
            type="button"
            onClick={startAdd}
            className="w-full py-2.5 px-4 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/10 hover:bg-primary-50 dark:hover:bg-primary-950/20 border-t border-gray-100 dark:border-dark-600/50 flex items-center justify-center gap-2 transition-colors mt-auto flex-shrink-0"
          >
            <Plus size={14} />
            <span>Add New Asset Type</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        name={name}
        className={`w-full min-h-[42px] flex items-center justify-between px-3.5 py-2 rounded-xl bg-white dark:bg-dark-800 border text-sm text-left transition-all outline-none focus:ring-2 focus:ring-primary-500/20 ${error
            ? 'border-red-400 dark:border-red-500/60 focus:border-red-400'
            : 'border-gray-200 dark:border-dark-600/70 hover:border-gray-300 dark:hover:border-dark-500 focus:border-primary-500'
          }`}
      >
        {isMulti ? (
          selectedObjects.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-w-[90%]">
              {selectedObjects.map((item) => (
                <span
                  key={item.code}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-900/50"
                >
                  {renderIcon(item.icon, 'w-3 h-3 text-primary-500 dark:text-primary-400')}
                  <span>{item.name}</span>
                  <span
                    onClick={(e) => removeMultiItem(e, item.code)}
                    className="hover:bg-primary-100 dark:hover:bg-primary-900/50 p-0.5 rounded-md cursor-pointer transition-colors"
                  >
                    <X size={10} />
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )
        ) : selectedLabel ? (
          <div className="flex items-center gap-2.5 text-gray-900 dark:text-white">
            {renderIcon(assetTypes.find((t) => t.code === value)?.icon)}
            <span>{selectedLabel}</span>
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}

        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180 text-primary-500' : ''
            }`}
        />
      </button>

      {/* Error Message */}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {/* Popover list for desktop / Drawer for mobile */}
      <AnimatePresence>
        {isOpen && (
          <>
            {isMobile ? (
              <>
                {/* Mobile Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 bg-black z-50 md:hidden"
                />
                {/* Mobile Bottom Sheet Drawer */}
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                  className="fixed left-0 right-0 bottom-0 bg-white dark:bg-dark-800 rounded-t-3xl z-50 md:hidden overflow-hidden max-h-[70vh] border-t border-gray-100 dark:border-dark-700 shadow-2xl flex flex-col"
                >
                  {/* Drawer Handle */}
                  <div className="w-12 h-1.5 bg-gray-200 dark:bg-dark-600 rounded-full mx-auto my-3 flex-shrink-0" />
                  <div className="px-4 pb-2 border-b border-gray-100 dark:border-dark-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold text-gray-900 dark:text-white font-heading text-base">
                      {placeholder}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {renderDropdownList()}
                  </div>
                </motion.div>
              </>
            ) : (
              /* Desktop Dropdown Popover */
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 4 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 left-0 right-0 mt-1.5 bg-white/90 dark:bg-dark-800/90 backdrop-blur-md border border-gray-200/80 dark:border-dark-600/70 rounded-2xl shadow-xl overflow-hidden"
              >
                {renderDropdownList()}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

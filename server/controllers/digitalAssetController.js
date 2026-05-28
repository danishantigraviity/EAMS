const DigitalAsset = require('../models/DigitalAsset');
const { cloudinary } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

exports.getDigitalAssets = async (req, res, next) => {
  try {
    const { category, fileType, tags, uploadedBy, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (fileType) filter.fileType = { $regex: fileType, $options: 'i' };
    if (uploadedBy) filter.uploadedBy = uploadedBy;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (search) filter.$text = { $search: search };

    // Non-admins can only see public or their own files
    if (!['super_admin', 'it_team'].includes(req.user.role)) {
      filter.$or = [{ isPublic: true }, { uploadedBy: req.user._id }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [assets, total] = await Promise.all([
      DigitalAsset.find(filter)
        .populate('uploadedBy', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      DigitalAsset.countDocuments(filter),
    ]);

    res.json({ success: true, data: assets, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) { next(error); }
};

exports.uploadDigitalAsset = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const { tags, category, description, isPublic, force } = req.body;
    
    // Duplicate Detection: Check if the exact same file name was already uploaded by this user
    const existingFile = await DigitalAsset.findOne({ originalName: req.file.originalname, uploadedBy: req.user._id });

    if (existingFile && force !== 'true') {
      if (existingFile.fileSize === req.file.size) {
        // Delete the newly uploaded file to avoid orphaned storage files
        if (req.file.filename) {
          await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
        }
        return res.status(409).json({
          success: false,
          duplicate: true,
          message: 'An identical file (same name and size) already exists. Do you want to upload it anyway as a new version?',
          assetId: existingFile._id
        });
      }
    }

    const isZip = req.file.originalname.toLowerCase().endsWith('.zip') || req.file.mimetype === 'application/zip';

    // If an existing file exists and we are forcing/updating version
    if (existingFile) {
      // 1. Move current main details to versionHistory
      const historyEntry = {
        version: existingFile.version,
        fileName: existingFile.fileName,
        originalName: existingFile.originalName,
        fileUrl: existingFile.fileUrl,
        publicId: existingFile.publicId,
        fileSize: existingFile.fileSize,
        uploadedBy: existingFile.uploadedBy,
        createdAt: existingFile.updatedAt || existingFile.createdAt || Date.now(),
      };

      existingFile.versionHistory.push(historyEntry);

      // 2. Update with new file info
      existingFile.fileName = req.file.originalname.replace(/\s+/g, '_');
      existingFile.fileType = req.file.mimetype;
      existingFile.fileUrl = req.file.path;
      existingFile.publicId = req.file.filename;
      existingFile.fileSize = req.file.size;
      existingFile.version += 1;

      if (tags) existingFile.tags = tags.split(',').map((t) => t.trim());
      if (category) existingFile.category = category;
      if (description !== undefined) existingFile.description = description;
      if (isPublic !== undefined) existingFile.isPublic = isPublic === 'true';

      // 3. Extract if ZIP
      if (isZip) {
        try {
          const AdmZip = require('adm-zip');
          const extractedPath = path.join(__dirname, '../uploads/extracted', existingFile._id.toString());
          
          if (!fs.existsSync(extractedPath)) {
            fs.mkdirSync(extractedPath, { recursive: true });
          }

          const zip = new AdmZip(req.file.localPath);
          zip.extractAllTo(extractedPath, true);

          const zipEntries = zip.getEntries();
          existingFile.extractedFiles = zipEntries
            .filter(entry => !entry.entryName.includes('__MACOSX') && !entry.entryName.endsWith('.DS_Store'))
            .map(entry => ({
              path: entry.entryName,
              size: entry.header.size,
              isDirectory: entry.isDirectory
            }));
          existingFile.extractedPath = extractedPath;
        } catch (err) {
          console.error('ZIP Extraction failed:', err);
        }
      }

      await existingFile.save();
      const populated = await DigitalAsset.findById(existingFile._id).populate('uploadedBy', 'name email');
      return res.status(200).json({ success: true, data: populated, message: 'File version updated successfully.' });
    }

    // Creating a brand new digital asset
    const assetData = {
      fileName: req.file.originalname.replace(/\s+/g, '_'),
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileUrl: req.file.path,
      publicId: req.file.filename,
      fileSize: req.file.size,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      uploadedBy: req.user._id,
      category: category || 'document',
      description: description || '',
      isPublic: isPublic === 'true',
      version: 1,
    };

    let asset = await DigitalAsset.create(assetData);

    if (isZip) {
      try {
        const AdmZip = require('adm-zip');
        const extractedPath = path.join(__dirname, '../uploads/extracted', asset._id.toString());

        if (!fs.existsSync(extractedPath)) {
          fs.mkdirSync(extractedPath, { recursive: true });
        }

        const zip = new AdmZip(req.file.localPath);
        zip.extractAllTo(extractedPath, true);

        const zipEntries = zip.getEntries();
        const extractedFiles = zipEntries
          .filter(entry => !entry.entryName.includes('__MACOSX') && !entry.entryName.endsWith('.DS_Store'))
          .map(entry => ({
            path: entry.entryName,
            size: entry.header.size,
            isDirectory: entry.isDirectory
          }));

        asset.extractedFiles = extractedFiles;
        asset.extractedPath = extractedPath;
        await asset.save();
      } catch (err) {
        console.error('ZIP Extraction failed:', err);
      }
    }

    const populated = await DigitalAsset.findById(asset._id).populate('uploadedBy', 'name email');
    res.status(201).json({ success: true, data: populated, message: 'File uploaded successfully.' });
  } catch (error) { next(error); }
};

exports.updateDigitalAsset = async (req, res, next) => {
  try {
    const { tags, category, isPublic, description } = req.body;
    const updates = {};
    if (tags !== undefined) updates.tags = tags.split ? tags.split(',').map((t) => t.trim()) : tags;
    if (category) updates.category = category;
    if (isPublic !== undefined) updates.isPublic = isPublic;
    if (description !== undefined) updates.description = description;

    const asset = await DigitalAsset.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('uploadedBy', 'name email');

    if (!asset) return res.status(404).json({ success: false, message: 'File not found.' });
    res.json({ success: true, data: asset, message: 'File updated.' });
  } catch (error) { next(error); }
};

exports.deleteDigitalAsset = async (req, res, next) => {
  try {
    const asset = await DigitalAsset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'File not found.' });

    // 1. Delete main file from Cloudinary/Local
    if (asset.publicId) {
      const resourceType = asset.fileType.startsWith('video') ? 'video' : asset.fileType.startsWith('image') ? 'image' : 'raw';
      await cloudinary.uploader.destroy(asset.publicId, { resource_type: resourceType }).catch(() => {});
    }

    // 2. Delete version history files
    if (asset.versionHistory && asset.versionHistory.length > 0) {
      for (const oldVer of asset.versionHistory) {
        if (oldVer.publicId) {
          const resourceType = oldVer.fileType?.startsWith('video') ? 'video' : oldVer.fileType?.startsWith('image') ? 'image' : 'raw';
          await cloudinary.uploader.destroy(oldVer.publicId, { resource_type: resourceType }).catch(() => {});
        }
      }
    }

    // 3. Delete extracted folder
    const extractedFolder = path.join(__dirname, '../uploads/extracted', asset._id.toString());
    if (fs.existsSync(extractedFolder)) {
      fs.rmSync(extractedFolder, { recursive: true, force: true });
    }

    await asset.deleteOne();
    res.json({ success: true, message: 'File deleted.' });
  } catch (error) { next(error); }
};

exports.getDownloadUrl = async (req, res, next) => {
  try {
    const asset = await DigitalAsset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'File not found.' });

    // Generate signed URL (expires in 1 hour)
    const signedUrl = cloudinary.utils.private_download_url(asset.publicId, asset.fileType.split('/')[1], {
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });

    asset.downloadCount += 1;
    await asset.save();

    res.json({ success: true, data: { downloadUrl: signedUrl || asset.fileUrl } });
  } catch (error) { next(error); }
};

exports.getExtractedFileContent = async (req, res, next) => {
  try {
    const asset = await DigitalAsset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'File not found.' });

    // Access check: non-admins can only see public or their own files
    if (!['super_admin', 'it_team'].includes(req.user.role) && !asset.isPublic && asset.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const filePathParam = req.query.path;
    if (!filePathParam) return res.status(400).json({ success: false, message: 'Path parameter is required.' });

    // Security check: resolve the path and make sure it remains inside the extracted sandbox
    const sandboxDir = path.resolve(path.join(__dirname, '../uploads/extracted', asset._id.toString()));
    const targetPath = path.resolve(path.join(sandboxDir, filePathParam));

    if (!targetPath.startsWith(sandboxDir)) {
      return res.status(403).json({ success: false, message: 'Access denied (directory traversal detected).' });
    }

    if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const ext = path.extname(targetPath).toLowerCase();
    const textExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.json', '.html', '.css', '.md', '.txt',
      '.xml', '.yml', '.yaml', '.sh', '.properties', '.gradle', '.go', '.rs', '.c', '.cpp', '.h'
    ];

    if (textExtensions.includes(ext) || fs.statSync(targetPath).size < 1024 * 1024) {
      // Small binary or general text code files
      const content = fs.readFileSync(targetPath, 'utf8');
      return res.json({ success: true, isText: true, content });
    } else {
      const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext);
      if (isImage) {
        const relativeUrl = `/uploads/extracted/${asset._id}/${filePathParam.replace(/\\/g, '/')}`;
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        return res.json({ success: true, isText: false, isImage: true, fileUrl: `${baseUrl}${relativeUrl}` });
      }
      return res.json({ success: true, isText: false, message: 'Preview not supported for this file type.' });
    }
  } catch (error) { next(error); }
};

const Asset = require('../models/Asset');
const User = require('../models/User');
const License = require('../models/License');
const OcrData = require('../models/OcrData');
const AssetRequest = require('../models/AssetRequest');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Department = require('../models/Department');

const getLiveDatabaseContext = async (userMessage, user) => {
  const query = userMessage.toLowerCase();
  let dbResults = null;
  let category = '';

  try {
    if (query.includes('how many') || query.includes('count') || query.includes('total') || query.includes('summary') || query.includes('statistic')) {
      const totalAssets = await Asset.countDocuments({ isDeleted: false });
      const availableAssets = await Asset.countDocuments({ status: 'available', isDeleted: false });
      const assignedAssets = await Asset.countDocuments({ status: 'assigned', isDeleted: false });
      const damagedAssets = await Asset.countDocuments({ status: 'damaged', isDeleted: false });
      const maintenanceAssets = await Asset.countDocuments({ status: 'maintenance', isDeleted: false });
      
      const totalLicenses = await License.countDocuments();
      const totalEmployees = await User.countDocuments({ isDeleted: false });
      const pendingRequests = await AssetRequest.countDocuments({ status: 'pending' });
      const openMaintenance = await MaintenanceRequest.countDocuments({ status: 'open' });
      
      category = 'system statistics';
      dbResults = {
        totalAssets,
        availableAssets,
        assignedAssets,
        damagedAssets,
        maintenanceAssets,
        totalLicenses,
        totalEmployees,
        pendingRequests,
        openMaintenance
      };
    } else if (query.includes('unassigned') || query.includes('available') || query.includes('free')) {
      let type = null;
      if (query.includes('laptop')) type = 'Laptop';
      else if (query.includes('desktop')) type = 'Desktop';
      else if (query.includes('chair')) type = 'Chair';
      else if (query.includes('monitor')) type = 'Monitor';
      else if (query.includes('printer')) type = 'Printer';
      else if (query.includes('phone') || query.includes('mobile')) type = 'Mobile Phone';
      
      const filter = { status: 'available', isDeleted: false };
      if (type) filter.type = { $regex: new RegExp(type, 'i') };
      
      const assets = await Asset.find(filter).populate('department').limit(10);
      category = `available assets${type ? ' of type ' + type : ''}`;
      dbResults = assets.map(a => ({
        name: a.name,
        type: a.type,
        serialNumber: a.serialNumber,
        department: a.department?.name || 'N/A',
        location: a.location || 'N/A',
        cost: a.cost || 0
      }));
    } else if (query.includes('my asset') || query.includes('assigned to me') || (query.includes('what asset') && query.includes('i have'))) {
      const assets = await Asset.find({ assignedTo: user._id, isDeleted: false }).limit(10);
      category = `assets assigned to ${user.name}`;
      dbResults = assets.map(a => ({
        name: a.name,
        type: a.type,
        serialNumber: a.serialNumber,
        status: a.status,
        location: a.location || 'N/A'
      }));
    } else if (query.includes('broken') || query.includes('damaged') || query.includes('maintenance')) {
      const assets = await Asset.find({ status: { $in: ['damaged', 'maintenance'] }, isDeleted: false }).limit(10);
      category = 'damaged or in-maintenance assets';
      dbResults = assets.map(a => ({
        name: a.name,
        type: a.type,
        serialNumber: a.serialNumber,
        status: a.status,
        location: a.location || 'N/A'
      }));
    } else if (query.includes('license') || query.includes('software')) {
      const licenses = await License.find().populate('department').limit(10);
      category = 'software licenses';
      dbResults = licenses.map(l => ({
        softwareName: l.softwareName,
        vendor: l.vendor,
        expiryDate: l.expiryDate,
        totalSeats: l.totalSeats,
        usedSeats: l.usedSeats,
        availableSeats: l.totalSeats - l.usedSeats,
        isExpiringSoon: (() => {
          const thirtyDays = new Date();
          thirtyDays.setDate(thirtyDays.getDate() + 30);
          return l.expiryDate <= thirtyDays && l.expiryDate >= new Date();
        })()
      }));
    } else if (query.includes('request') || query.includes('my request') || query.includes('pending request')) {
      const filter = {};
      if (user.role === 'employee') {
        filter.requestedBy = user._id;
      }
      if (query.includes('pending')) {
        filter.status = 'pending';
      }
      const requests = await AssetRequest.find(filter).populate('requestedBy').sort('-createdAt').limit(10);
      category = `${user.role === 'employee' ? 'your' : 'system'} asset requests`;
      dbResults = requests.map(r => ({
        requestedBy: r.requestedBy?.name || 'N/A',
        assetType: r.assetType,
        description: r.description,
        urgency: r.urgency,
        status: r.status,
        createdAt: r.createdAt
      }));
    } else if (query.includes('maintenance request') || query.includes('ticket') || query.includes('repair')) {
      const filter = {};
      if (user.role === 'employee') {
        filter.reportedBy = user._id;
      }
      const requests = await MaintenanceRequest.find(filter).populate('assetId').populate('reportedBy').sort('-createdAt').limit(10);
      category = `${user.role === 'employee' ? 'your' : 'system'} maintenance tickets`;
      dbResults = requests.map(r => ({
        assetName: r.assetId?.name || 'N/A',
        reportedBy: r.reportedBy?.name || 'N/A',
        issue: r.issue,
        priority: r.priority,
        status: r.status,
        createdAt: r.createdAt
      }));
    } else if (user.role !== 'employee' && (query.includes('employee') || query.includes('user') || query.includes('who works') || query.includes('staff'))) {
      const employees = await User.find({ isDeleted: false }).populate('departmentId').limit(10);
      category = 'registered employees';
      dbResults = employees.map(e => ({
        name: e.name,
        email: e.email,
        role: e.role,
        department: e.departmentId?.name || 'N/A'
      }));
    } else {
      const words = query.split(/\s+/).filter(w => w.length > 2 && !['show', 'find', 'list', 'search', 'what', 'where', 'have', 'with'].includes(w));
      if (words.length > 0) {
        const assets = await Asset.find({
          $or: words.map(w => ({ name: new RegExp(w, 'i') })),
          isDeleted: false
        }).populate('assignedTo').limit(5);
        if (assets.length > 0) {
          category = `assets matching search term(s)`;
          dbResults = assets.map(a => ({
            name: a.name,
            type: a.type,
            serialNumber: a.serialNumber,
            status: a.status,
            assignedTo: a.assignedTo?.name || 'Unassigned',
            location: a.location || 'N/A'
          }));
        }
      }
    }
  } catch (err) {
    console.error('Error fetching database context:', err);
  }

  return { category, dbResults };
};

const formatLocalReply = (category, dbResults, userMessage, user) => {
  if (!dbResults) {
    return null;
  }

  if (category === 'system statistics') {
    return `Here is the real-time summary from the database:
• **Total Assets**: ${dbResults.totalAssets} (${dbResults.availableAssets} available, ${dbResults.assignedAssets} assigned)
• **Damaged/In Maintenance**: ${dbResults.damagedAssets + dbResults.maintenanceAssets}
• **Software Licenses**: ${dbResults.totalLicenses}
• **Registered Users**: ${dbResults.totalEmployees}
• **Pending Asset Requests**: ${dbResults.pendingRequests}
• **Open Maintenance Tickets**: ${dbResults.openMaintenance}`;
  }

  if (Array.isArray(dbResults)) {
    if (dbResults.length === 0) {
      return `I checked the live database for ${category}, but found 0 matching records.`;
    }

    let reply = `Here are the matching records found in the database for **${category}**:\n\n`;
    dbResults.forEach((item, index) => {
      if (item.name) {
        // Asset
        reply += `${index + 1}. **${item.name}** (${item.type})\n`;
        reply += `   • Serial: \`${item.serialNumber}\`\n`;
        if (item.assignedTo) reply += `   • Assigned to: ${item.assignedTo}\n`;
        if (item.location && item.location !== 'N/A') reply += `   • Location: ${item.location}\n`;
        if (item.status) reply += `   • Status: *${item.status}*\n`;
      } else if (item.softwareName) {
        // License
        reply += `${index + 1}. **${item.softwareName}** (by ${item.vendor})\n`;
        reply += `   • Expiry: ${new Date(item.expiryDate).toLocaleDateString()}\n`;
        reply += `   • Seats Used: ${item.usedSeats} / ${item.totalSeats}\n`;
        if (item.isExpiringSoon) reply += `   • ⚠️ *Expiring within 30 days!*\n`;
      } else if (item.assetType) {
        // AssetRequest
        reply += `${index + 1}. **${item.assetType}** request by *${item.requestedBy}*\n`;
        reply += `   • Urgency: ${item.urgency} | Status: *${item.status}*\n`;
        reply += `   • Description: "${item.description}"\n`;
      } else if (item.reportedBy) {
        // MaintenanceRequest
        reply += `${index + 1}. Ticket for **${item.assetName}** reported by *${item.reportedBy}*\n`;
        reply += `   • Issue: "${item.issue}"\n`;
        reply += `   • Priority: ${item.priority} | Status: *${item.status}*\n`;
      } else if (item.email) {
        // Employee
        reply += `${index + 1}. **${item.name}** (${item.role})\n`;
        reply += `   • Email: ${item.email}\n`;
        reply += `   • Dept: ${item.department}\n`;
      }
    });

    return reply;
  }

  return JSON.stringify(dbResults);
};

const getLocalChatbotReply = async (userMessage, user) => {
  const { category, dbResults } = await getLiveDatabaseContext(userMessage, user);
  const formatted = formatLocalReply(category, dbResults, userMessage, user);
  if (formatted) return formatted;

  const query = userMessage.toLowerCase();
  if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
    return `Hello ${user.name}! I am your EAMS AI assistant. How can I help you today? You can ask me to find assets, check licenses, or list maintenance requests.`;
  }
  if (query.includes('founder') || query.includes('creator') || query.includes('build') || query.includes('who made')) {
    return `EAMS (Enterprise Asset Management System) was built by the development team to help manage software licenses, hardware inventory, and employee requests.`;
  }

  return `I am running in local offline mode. I can help you check asset counts, licenses, and user status. Try asking 'how many assets do we have?'.`;
};

// POST /api/ai/chat - proxy to Anthropic LLM with local fallback
exports.chat = async (req, res, next) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Messages array required.' });
    }

    const lastMessage = messages[messages.length - 1]?.content || '';

    // Fetch context from MongoDB database
    const { category, dbResults } = await getLiveDatabaseContext(lastMessage, req.user);

    // Fallback to local chatbot if API key is not configured
    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey || apiKey.includes('your_') || apiKey.length < 5) {
      const reply = await getLocalChatbotReply(lastMessage, req.user);
      return res.json({ success: true, data: { reply } });
    }

    let systemPrompt = `You are an AI assistant for EAMS (Enterprise Asset Management System).
Help users find assets, check statuses, understand reports, and raise requests.
Be concise, helpful, and professional. Always answer based on the company's asset management context.`;

    if (category && dbResults) {
      systemPrompt += `\n\nHere is the real-time context fetched from the database for the user's current query ("${category}"):
${JSON.stringify(dbResults, null, 2)}
Use this actual live data to formulate your response. Present the data clearly and concisely.`;
    }

    const isGemini = apiKey.startsWith('AQ') || !apiKey.startsWith('sk-');

    if (isGemini) {
      try {
        const contents = messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`Gemini API failed (${response.status}): ${errText}. Falling back to local offline AI.`);
          const reply = await getLocalChatbotReply(lastMessage, req.user);
          return res.json({ success: true, data: { reply } });
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
        return res.json({ success: true, data: { reply } });
      } catch (geminiError) {
        console.warn(`Gemini API call failed: ${geminiError.message}. Falling back to local offline AI.`);
        const reply = await getLocalChatbotReply(lastMessage, req.user);
        return res.json({ success: true, data: { reply } });
      }
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`LLM API failed (${response.status}): ${errText}. Falling back to local offline AI.`);
        const reply = await getLocalChatbotReply(lastMessage, req.user);
        return res.json({ success: true, data: { reply } });
      }

      const data = await response.json();
      const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
      res.json({ success: true, data: { reply } });
    } catch (apiError) {
      console.warn(`External AI API call failed: ${apiError.message}. Falling back to local offline AI.`);
      const reply = await getLocalChatbotReply(lastMessage, req.user);
      res.json({ success: true, data: { reply } });
    }
  } catch (error) {
    next(error);
  }
};// POST /api/ai/ocr - Invoice scanner using Tesseract
exports.ocrScan = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file required.' });
    }

    const { createWorker } = require('tesseract.js');
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(req.file.localPath || req.file.path);
    await worker.terminate();

    const extracted = {
      vendor: extractVendor(text),
      amount: extractAmount(text),
      purchaseDate: extractDate(text),
      serialNumber: extractSerial(text),
      rawText: text,
    };

    // Save OCR scanned result to database
    const ocrRecord = new OcrData({
      uploadedBy: req.user._id,
      imageUrl: req.file.path || '',
      extractedText: text,
      parsedData: {
        vendor: extracted.vendor,
        amount: extracted.amount,
        purchaseDate: extracted.purchaseDate ? new Date(extracted.purchaseDate) : null,
        serialNumber: extracted.serialNumber,
      },
      status: 'draft',
    });
    await ocrRecord.save();

    res.json({
      success: true,
      data: {
        ...extracted,
        ocrRecordId: ocrRecord._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

function extractVendor(text) {
  const patterns = [
    /(?:vendor|supplier|from|company|bill\s+from)[\s:]+([A-Za-z\s&.,-]+)/i,
    /^([A-Z][A-Za-z\s]+(?:Ltd|Inc|Corp|Co\.|LLC|Pvt)?)/m,
  ];
  for (const p of patterns) {
    const match = text.match(p);
    if (match) return match[1].trim().replace(/\n.*/s, '');
  }
  return '';
}

function extractAmount(text) {
  const match = text.match(/(?:total|amount|grand\s+total|price|cost|net\s+amount)[\s:]*[$₹€£]?\s*([\d,]+\.?\d*)/i);
  return match ? parseFloat(match[1].replace(/,/g, '')) : null;
}

function extractDate(text) {
  const patterns = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i,
  ];
  for (const p of patterns) {
    const match = text.match(p);
    if (match) {
      const d = new Date(match[1]);
      if (!isNaN(d)) return d.toISOString().split('T')[0];
    }
  }
  return null;
}

function extractSerial(text) {
  const match = text.match(/(?:serial\s*(?:no|number)?|s\/n|sn|model\s*(?:no)?)[\s:#]+([A-Z0-9\-]{5,20})/i);
  return match ? match[1].trim() : '';
}

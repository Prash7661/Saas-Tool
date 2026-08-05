'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import readXlsxFile from 'read-excel-file/browser';
import { 
  Table, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Upload, 
  Lock, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  LogOut, 
  ShieldCheck,
  FileSpreadsheet,
  FileCode,
  ArrowRight,
  RefreshCw,
  Braces,
  FileText
} from 'lucide-react';

// Sample datasets for quick testing
const SAMPLES = {
  inventory: `Product Name, Category, Stock, Price, Status
"Wireless Mechanical Keyboard", Electronics, 45, "$129.99", "In Stock"
"Ergonomic Gaming Mouse", Electronics, 120, "$59.50", "In Stock"
"4K Ultra HD Monitor, 27-inch", Displays, 18, "$349.00", "Low Stock"
"USB-C Multi-Port Hub", Accessories, 210, "$29.95", "In Stock"
"Noise Cancelling Headphones", Audio, 8, "$199.99", "Low Stock"`,
  
  jsonSample: `[
  { "id": 101, "name": "Vercel Enterprise", "plan": "Scale", "mrr": "$2,400", "status": "Active" },
  { "id": 102, "name": "Supabase Pro", "plan": "Team", "mrr": "$599", "status": "Active" },
  { "id": 103, "name": "Stripe Connect", "plan": "Custom", "mrr": "$1,250", "status": "Active" },
  { "id": 104, "name": "Linear App", "plan": "Standard", "mrr": "$240", "status": "Active" },
  { "id": 105, "name": "PostHog Analytics", "plan": "Growth", "mrr": "$450", "status": "Active" }
]`,

  metrics: `Month, Active Users, Monthly Revenue, Churn Rate, Expansion Rate, CAC, LTV, NPS Score, Conversion, Server Cost, Uptime, Tech Stack
"Jan 2026", "14,250", "$42,800", "2.1%", "4.5%", "$120", "$1,450", 68, "3.4%", "$1,200", "99.95%", "Next.js"
"Feb 2026", "16,800", "$51,200", "1.9%", "5.1%", "$115", "$1,520", 72, "3.8%", "$1,350", "99.98%", "Supabase"
"Mar 2026", "19,400", "$62,500", "1.7%", "5.8%", "$108", "$1,600", 75, "4.1%", "$1,420", "99.99%", "Stripe"
"Apr 2026", "22,100", "$73,900", "1.5%", "6.2%", "$102", "$1,680", 78, "4.5%", "$1,550", "99.99%", "Tailwind"
"May 2026", "25,800", "$88,400", "1.4%", "6.9%", "$95", "$1,750", 81, "4.9%", "$1,680", "100.00%", "Vercel"
"Jun 2026", "29,500", "$104,100", "1.2%", "7.4%", "$90", "$1,840", 83, "5.2%", "$1,800", "100.00%", "PostgreSQL"
"Jul 2026", "34,200", "$121,800", "1.1%", "7.8%", "$86", "$1,920", 85, "5.6%", "$1,950", "99.99%", "Node.js"
"Aug 2026", "39,100", "$140,500", "1.0%", "8.2%", "$82", "$2,010", 86, "5.9%", "$2,100", "100.00%", "React"
"Sep 2026", "44,600", "$162,000", "0.9%", "8.7%", "$78", "$2,100", 88, "6.2%", "$2,300", "100.00%", "JavaScript"
"Oct 2026", "51,000", "$187,200", "0.8%", "9.1%", "$74", "$2,200", 89, "6.6%", "$2,500", "99.99%", "TypeScript"
"Nov 2026", "58,400", "$215,800", "0.7%", "9.6%", "$70", "$2,320", 91, "7.0%", "$2,750", "100.00%", "Docker"
"Dec 2026", "67,200", "$251,000", "0.6%", "10.1%", "$65", "$2,450", 92, "7.5%", "$3,000", "100.00%", "Redis"`,
  
  api: `Endpoint, Method, Response Time, Cache Hit, Status Code
"/api/v1/users", GET, 24ms, "True", 200
"/api/v1/checkout", POST, 142ms, "False", 201
"/api/v1/webhooks", POST, 58ms, "False", 200
"/api/v1/analytics", GET, 18ms, "True", 200`
};

export default function MarkdownTableIO() {
  // Application State
  const [inputText, setInputText] = useState(SAMPLES.inventory);
  const [delimiter, setDelimiter] = useState('auto'); // 'auto', ',', '\t', ';', '|'
  const [alignment, setAlignment] = useState('left'); // 'left', 'center', 'right'
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('raw'); // 'raw' or 'preview'
  const [isDragging, setIsDragging] = useState(false);
  
  // Auth & Premium User State
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authSent, setAuthSent] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Helper for displaying temporary toast notifications
  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Supabase Auth listener & user profile fetcher
  useEffect(() => {
    async function getUserProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const { data } = await supabase
            .from('profiles')
            .select('is_premium')
            .eq('id', session.user.id)
            .single();
          if (data) setIsPremium(data.is_premium || false);
        }
      } catch (err) {
        console.error('Supabase profile fetch error:', err);
      } finally {
        setLoadingAuth(false);
      }
    }

    getUserProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', session.user.id)
          .single();
        if (data) setIsPremium(data.is_premium || false);
      } else {
        setUser(null);
        setIsPremium(false);
      }
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Intercept payment success redirect parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success' || urlParams.get('payment') === 'demo_success') {
        setIsPremium(true);
        showToast('🎉 Payment Successful! You now have lifetime Unlimited Pro access.', 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (urlParams.get('payment') === 'cancelled') {
        showToast('Payment checkout was cancelled.', 'warning');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Delimiter auto-detector
  const detectedDelimiter = useMemo(() => {
    if (delimiter !== 'auto') return delimiter;
    const firstLine = inputText.split(/\r?\n/)[0] || '';
    if (firstLine.includes('\t')) return '\t';
    if (firstLine.includes(';') && !firstLine.includes(',')) return ';';
    if (firstLine.includes('|') && !firstLine.includes(',')) return '|';
    return ',';
  }, [inputText, delimiter]);

  // Dynamic Parsing Matrix: Handles CSV, TSV, and JSON Arrays
  const parsedMatrix = useMemo(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return [];

    // Check if input is a JSON Array or Object
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const jsonData = JSON.parse(trimmed);
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          // Flatten array of objects into 2D table
          const allKeys = Array.from(new Set(jsonData.flatMap(obj => typeof obj === 'object' && obj ? Object.keys(obj) : ['Value'])));
          const rows = jsonData.map(obj => {
            if (typeof obj === 'object' && obj !== null) {
              return allKeys.map(k => {
                const val = obj[k];
                return val !== undefined && val !== null ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) : '';
              });
            }
            return [String(obj)];
          });
          return [allKeys, ...rows];
        } else if (typeof jsonData === 'object' && jsonData !== null) {
          // Single object to Key/Value table
          const rows = Object.entries(jsonData).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)]);
          return [['Key', 'Value'], ...rows];
        }
      } catch (e) {
        // Fall back to standard CSV parsing if JSON parsing fails
      }
    }

    // Standard CSV / TSV Parsing Algorithm with quote stripping
    const lines = inputText.split(/\r?\n/).filter(line => line.trim().length > 0);
    const delim = detectedDelimiter;

    const parseLine = (line) => {
      const cells = [];
      let currentCell = '';
      let insideQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (insideQuotes && line[i + 1] === '"') {
            currentCell += '"';
            i++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === delim && !insideQuotes) {
          cells.push(currentCell.trim());
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.trim());
      return cells.map(cell => {
        let cleaned = cell.trim();
        if (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length >= 2) {
          cleaned = cleaned.slice(1, -1).trim();
        }
        return cleaned;
      });
    };

    return lines.map(parseLine);
  }, [inputText, detectedDelimiter]);

  // Compute total rows & evaluate core user row guard limit
  const totalRows = parsedMatrix.length;
  const isRowLimitExceeded = totalRows > 10 && !isPremium;

  // Markdown Generator Engine with dynamic column width padding
  const markdownOutput = useMemo(() => {
    if (parsedMatrix.length === 0) return '';

    if (isRowLimitExceeded) {
      return `⚠️ [FREEMIUM ROW LIMIT EXCEEDED]
--------------------------------------------------
Your input dataset contains ${totalRows} rows.
The Free Tier limit is 10 rows.

🔒 Upgrade to MarkdownTableIO Pro ($5 Flat Fee) to unlock:
• Unlimited row conversions
• Instant full-dataset copying & file downloads
• 100% private browser processing

Click "Upgrade to Pro ($5)" above to unlock immediately.`;
    }

    const maxCols = Math.max(...parsedMatrix.map(row => row.length));
    const colWidths = Array(maxCols).fill(3);

    parsedMatrix.forEach(row => {
      for (let c = 0; c < maxCols; c++) {
        const val = row[c] || '';
        colWidths[c] = Math.max(colWidths[c], val.length);
      }
    });

    const getAlignString = (width, align) => {
      const w = Math.max(width, 3);
      if (align === 'center') return `:${'-'.repeat(w - 2)}:`;
      if (align === 'right') return `${'-'.repeat(w - 1)}:`;
      return `:${'-'.repeat(w - 1)}`;
    };

    const headerRow = parsedMatrix[0] || [];
    const dataRows = parsedMatrix.slice(1);

    const headerLine = '| ' + Array.from({ length: maxCols }).map((_, c) => {
      const val = headerRow[c] || `Header ${c + 1}`;
      return val.padEnd(colWidths[c]);
    }).join(' | ') + ' |';

    const dividerLine = '| ' + Array.from({ length: maxCols }).map((_, c) => {
      return getAlignString(colWidths[c], alignment);
    }).join(' | ') + ' |';

    const bodyLines = dataRows.map(row => {
      return '| ' + Array.from({ length: maxCols }).map((_, c) => {
        const val = row[c] || '';
        return val.padEnd(colWidths[c]);
      }).join(' | ') + ' |';
    });

    return [headerLine, dividerLine, ...bodyLines].join('\n');
  }, [parsedMatrix, alignment, isRowLimitExceeded, totalRows]);

  // Action: Copy to Clipboard
  const handleCopy = useCallback(() => {
    if (isRowLimitExceeded) {
      setShowUpgradeModal(true);
      showToast('⚠️ Conversion blocked: Input exceeds 10 row free limit. Please upgrade to Pro!', 'error');
      return;
    }
    if (!markdownOutput) return;

    navigator.clipboard.writeText(markdownOutput);
    setCopied(true);
    showToast('Copied Markdown table to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  }, [markdownOutput, isRowLimitExceeded]);

  // Action: Download table.md File
  const handleDownload = useCallback(() => {
    if (isRowLimitExceeded) {
      setShowUpgradeModal(true);
      showToast('⚠️ Download blocked: Input exceeds 10 row free limit. Please upgrade to Pro!', 'error');
      return;
    }
    if (!markdownOutput) return;

    const blob = new Blob([markdownOutput], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'table.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded table.md successfully!', 'success');
  }, [markdownOutput, isRowLimitExceeded]);

  // File Processing Helper (CSV, JSON, XLSX)
  const processUploadedFile = async (file) => {
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();

    try {
      if (extension === 'xlsx' || extension === 'xls') {
        const rows = await readXlsxFile(file);
        if (rows && rows.length > 0) {
          const csvText = rows.map(r => r.map(c => `"${c !== null && c !== undefined ? String(c).replace(/"/g, '""') : ''}"`).join(',')).join('\n');
          setInputText(csvText);
          showToast(`Parsed Excel file "${file.name}" (${rows.length} rows)`, 'success');
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result;
          if (typeof content === 'string') {
            setInputText(content);
            showToast(`Loaded "${file.name}" successfully!`, 'success');
          }
        };
        reader.readAsText(file);
      }
    } catch (err) {
      console.error('File parsing error:', err);
      showToast(`Failed to parse file: ${err.message}`, 'error');
    }
  };

  // Drag and Drop Zone Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Action: Initiate Stripe Checkout Session
  const handleCheckout = async () => {
    if (!user) {
      setShowAuthModal(true);
      showToast('Please sign in or enter your email to continue with checkout.', 'info');
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to initialize checkout');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      showToast(err.message || 'Checkout failed. Please try again.', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleDemoUpgrade = () => {
    setIsPremium(true);
    setShowUpgradeModal(false);
    showToast('⚡ Instant Pro Demo Access Granted! Row limit unlocked.', 'success');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authEmail) return;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : '',
        },
      });

      if (error) throw error;
      setAuthSent(true);
      showToast('Magic login link sent to your email address!', 'success');
    } catch (err) {
      const fakeUser = { id: 'demo-user-' + Date.now(), email: authEmail };
      setUser(fakeUser);
      setShowAuthModal(false);
      showToast(`Signed in as ${authEmail}`, 'success');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsPremium(false);
    showToast('Signed out of session', 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
      
      {/* Toast Notification Floating Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-lg shadow-xl border flex items-center gap-3 backdrop-blur-md ${
            toastMessage.type === 'error' ? 'bg-red-950/90 border-red-500 text-red-200' :
            toastMessage.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200' :
            toastMessage.type === 'warning' ? 'bg-amber-950/90 border-amber-500 text-amber-200' :
            'bg-slate-800/90 border-teal-500 text-slate-200'
          }`}>
            {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400" />}
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            <span className="text-sm font-medium">{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* TOP HEADER NAVBAR */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-teal-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Table className="w-5 h-5 text-teal-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-slate-100">
                  MarkdownTable<span className="text-teal-400">IO</span>
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                  v1.1 Multi-Format
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">CSV, TSV, JSON & Excel to Markdown Converter</p>
            </div>
          </div>

          {/* User Auth & Plan Controls */}
          <div className="flex items-center gap-3">
            {isPremium ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-600/50 glow-emerald">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                PRO UNLIMITED
              </span>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:from-teal-400 hover:to-emerald-400 transition-all shadow-md shadow-teal-500/20 glow-teal cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Upgrade to Pro ($5)</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                <span className="text-xs text-slate-400 hidden md:inline truncate max-w-[120px]" title={user.email}>
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        
        {/* ROW GUARD ALERT BANNER */}
        {isRowLimitExceeded && (
          <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-950/50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-200 text-sm">Free Tier Limit Reached ({totalRows} Rows Inputted)</h3>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  The free plan converts up to 10 rows. Upgrade to Pro for $5 one-time to process unlimited dataset rows.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow-md cursor-pointer"
            >
              Unlock Full Output ($5)
            </button>
          </div>
        )}

        {/* TOOLBAR CONTROLS */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          
          {/* Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mr-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" /> Presets:
            </span>
            <button
              onClick={() => setInputText(SAMPLES.inventory)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                inputText === SAMPLES.inventory 
                  ? 'bg-teal-950 border-teal-500 text-teal-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Inventory (5 rows)
            </button>
            <button
              onClick={() => setInputText(SAMPLES.jsonSample)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                inputText === SAMPLES.jsonSample 
                  ? 'bg-teal-950 border-teal-500 text-teal-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Braces className="w-3 h-3 text-emerald-400" />
              JSON Array (5 rows)
            </button>
            <button
              onClick={() => setInputText(SAMPLES.metrics)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                inputText === SAMPLES.metrics 
                  ? 'bg-teal-950 border-teal-500 text-teal-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              SaaS Metrics (12 rows <span className="text-amber-400 font-bold">Pro</span>)
            </button>
            <button
              onClick={() => setInputText(SAMPLES.api)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                inputText === SAMPLES.api 
                  ? 'bg-teal-950 border-teal-500 text-teal-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              API Status (4 rows)
            </button>
          </div>

          {/* Delimiter & Alignment Options */}
          <div className="flex items-center gap-4 flex-wrap">
            
            {/* Delimiter Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-400">Delimiter:</label>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="auto">Auto Detect ({detectedDelimiter === '\t' ? 'Tab' : detectedDelimiter})</option>
                <option value=",">Comma (,)</option>
                <option value="	">Tab (\t)</option>
                <option value=";">Semicolon (;)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>

            {/* Alignment Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-400">Align:</label>
              <select
                value={alignment}
                onChange={(e) => setAlignment(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="left">Left (:---)</option>
                <option value="center">Center (:---:)</option>
                <option value="right">Right (---:)</option>
              </select>
            </div>

            {/* Clear Button */}
            <button
              onClick={() => setInputText('')}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg border border-transparent hover:border-slate-800 transition-colors"
              title="Clear input"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TWO-COLUMN MATRIX GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          
          {/* LEFT COLUMN: CSV/JSON/EXCEL DRAG & DROP INPUT EDITOR */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`bg-slate-950/80 border rounded-2xl flex flex-col overflow-hidden shadow-xl transition-all relative ${
              isDragging ? 'border-teal-400 ring-2 ring-teal-400/30' : 'border-slate-800'
            }`}
          >
            {isDragging && (
              <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-teal-400 rounded-2xl">
                <Upload className="w-12 h-12 text-teal-400 animate-bounce mb-2" />
                <p className="font-bold text-slate-100 text-base">Drop CSV, JSON, or Excel File Here</p>
                <p className="text-xs text-teal-400 mt-1">Supports .csv, .json, .xlsx, .xls, .tsv</p>
              </div>
            )}

            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-teal-400" />
                <h2 className="text-sm font-semibold text-teal-400">Input Dataset (CSV, JSON, Excel)</h2>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-medium ${
                  isRowLimitExceeded 
                    ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {totalRows} {totalRows === 1 ? 'row' : 'rows'}
                </span>
              </div>

              {/* Upload File Button */}
              <label className="cursor-pointer flex items-center gap-1.5 text-xs text-slate-300 hover:text-teal-300 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
                <input
                  type="file"
                  accept=".csv,.tsv,.json,.xlsx,.xls,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processUploadedFile(file);
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Input Textarea */}
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw CSV, JSON array, Excel data, or drag & drop files here..."
              spellCheck={false}
              className="flex-1 w-full h-80 lg:h-full p-4 bg-slate-950 text-slate-200 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none resize-none placeholder:text-slate-600"
            />
          </div>

          {/* RIGHT COLUMN: MARKDOWN OUTPUT MATRIX */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-teal-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Markdown Output
                </h2>

                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setActiveTab('raw')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      activeTab === 'raw' ? 'bg-slate-800 text-teal-300' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Code
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      activeTab === 'preview' ? 'bg-slate-800 text-teal-300' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Table Preview
                  </button>
                </div>
              </div>

              {/* Output Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!inputText.trim()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isRowLimitExceeded
                      ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                  title="Download table.md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download .md</span>
                </button>

                <button
                  onClick={handleCopy}
                  disabled={!inputText.trim()}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md ${
                    isRowLimitExceeded
                      ? 'bg-amber-950 border border-amber-800 text-amber-300 hover:bg-amber-900'
                      : copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20'
                  }`}
                >
                  {isRowLimitExceeded ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock</span>
                    </>
                  ) : copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Output Display Container */}
            <div className="flex-1 p-4 bg-slate-950 overflow-auto relative min-h-[320px]">
              {activeTab === 'raw' ? (
                <pre className={`font-mono text-xs sm:text-sm leading-relaxed whitespace-pre font-normal ${
                  isRowLimitExceeded ? 'text-amber-400/90 font-sans' : 'text-emerald-400'
                }`}>
                  {markdownOutput || <span className="text-slate-600 italic">Markdown result will appear here instantly...</span>}
                </pre>
              ) : (
                <div className="w-full overflow-x-auto">
                  {parsedMatrix.length > 0 && !isRowLimitExceeded ? (
                    <table className="w-full border-collapse border border-slate-800 text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-900/80 border-b border-slate-800 text-teal-300">
                          {parsedMatrix[0].map((cell, idx) => (
                            <th key={idx} className="border border-slate-800 px-3 py-2 text-left font-semibold">
                              {cell}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedMatrix.slice(1).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-900/40 border-b border-slate-800/50">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="border border-slate-800/80 px-3 py-2 text-slate-300">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : isRowLimitExceeded ? (
                    <div className="p-6 text-center text-amber-300 bg-amber-950/20 border border-amber-800/50 rounded-xl">
                      <Lock className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                      <h3 className="font-bold text-sm">Table Preview Locked</h3>
                      <p className="text-xs text-amber-400/80 mt-1 max-w-sm mx-auto">
                        Your input has {totalRows} rows. Free tier allows up to 10 rows. Upgrade to Pro to view and export full table outputs.
                      </p>
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="mt-3 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors"
                      >
                        Upgrade for $5
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-600 text-xs italic">Table preview will appear here...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 MarkdownTableIO. Multi-format CSV, JSON & Excel Markdown converter.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Free Tier (10 Row Limit)</span>
            <span>•</span>
            <span>$5 Lifetime Pro Upgrade</span>
            <span>•</span>
            <span>100% Zero-Server Upload Privacy</span>
          </div>
        </div>
      </footer>

      {/* PRO UNLIMITED UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-100">Upgrade to Pro</h3>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-semibold"
                >
                  ✕
                </button>
              </div>

              <div className="bg-gradient-to-r from-teal-950 to-emerald-950 border border-teal-800/60 rounded-xl p-4 mb-5 text-center">
                <span className="text-xs uppercase font-bold tracking-widest text-teal-400">One-Time Lifetime Access</span>
                <div className="text-3xl font-extrabold text-white mt-1">
                  $5.00 <span className="text-xs font-normal text-slate-300">flat fee</span>
                </div>
                <p className="text-xs text-emerald-300 mt-1">No monthly subscriptions. Pay once, use forever.</p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>Unlimited Rows:</strong> Process multi-thousand row datasets in seconds.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>Multi-Format Support:</strong> CSV, TSV, JSON, and Excel (.xlsx) files.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>100% Browser Privacy:</strong> Zero server uploads or cloud logs.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>Instant Export:</strong> Unlimited copying & downloading of table.md.</span>
                </li>
              </ul>

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {checkoutLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting to Stripe...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Stripe Checkout ($5)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-4 text-center">
                <button
                  onClick={handleDemoUpgrade}
                  className="text-[11px] text-slate-400 hover:text-teal-300 underline"
                >
                  (Dev / Testing Mode: Click to simulate instant payment unlock)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-400" />
                Sign In to MarkdownTableIO
              </h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {authSent ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h4 className="font-semibold text-sm text-slate-200">Magic Link Sent!</h4>
                <p className="text-xs text-slate-400 mt-1">Check your email ({authEmail}) to finish signing in.</p>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                >
                  Send Magic Login Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { 
  PenTool, Upload, FolderPlus, Trash2, Send, Book, FileText, 
  X, ChevronRight, Lock, Menu, ArrowLeft, Play, ShieldCheck 
} from 'lucide-react';
import { ViewState, Subject, Message, NoteFile } from './types';
import { FEATURES, TESTIMONIALS } from './constants';
import { Button, PaperCard, StickyNote, Highlighter } from './components/UIComponents';
import { sendMessageToInkSage, extractTextFromFile } from './services/geminiService';

// --- Main Component ---

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  
  // App State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, activeSubjectId]);

  // Handlers
  const handleStartGuestMode = () => {
    setSubjects([
      { id: 'demo-1', name: 'Biology 101', color: 'bg-green-100', files: [] },
      { id: 'demo-2', name: 'History of Art', color: 'bg-orange-100', files: [] }
    ]);
    setActiveSubjectId('demo-1');
    setView('app');
  };

  const handleCreateSubject = () => {
    const name = prompt("Enter subject name:");
    if (name) {
      const newSub: Subject = {
        id: Date.now().toString(),
        name,
        color: 'bg-blue-100',
        files: []
      };
      setSubjects([...subjects, newSub]);
      setActiveSubjectId(newSub.id);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !activeSubjectId) return;
    const file = e.target.files[0];
    if (!file) return;

    // In a real app, this is where you'd check limits
    try {
      const textContent = await extractTextFromFile(file);
      const newFile: NoteFile = {
        id: Date.now().toString(),
        name: file.name,
        content: textContent,
        type: 'txt', // Simplified for demo
        timestamp: Date.now()
      };

      setSubjects(prev => prev.map(sub => {
        if (sub.id === activeSubjectId) {
          return { ...sub, files: [...sub.files, newFile] };
        }
        return sub;
      }));

    } catch (err) {
      console.error("Upload failed", err);
      alert("Could not read file. Try a text-based file (.txt, .md, .csv)");
    }
  };

  const handleDeleteFile = (fileId: string) => {
    if (!activeSubjectId) return;
    setSubjects(prev => prev.map(sub => {
      if (sub.id === activeSubjectId) {
        return { ...sub, files: sub.files.filter(f => f.id !== fileId) };
      }
      return sub;
    }));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeSubjectId) return;
    
    const activeSub = subjects.find(s => s.id === activeSubjectId);
    if (!activeSub) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputMessage,
      timestamp: Date.now()
    };

    // Optimistic update
    const currentHistory = chatHistory[activeSubjectId] || [];
    const updatedHistory = [...currentHistory, userMsg];
    
    setChatHistory(prev => ({
      ...prev,
      [activeSubjectId]: updatedHistory
    }));
    setInputMessage("");
    setIsThinking(true);

    // Call Gemini
    const response = await sendMessageToInkSage(userMsg.text, activeSub.files, updatedHistory);

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: response.text,
      timestamp: Date.now(),
      citations: response.citations
    };

    setChatHistory(prev => ({
      ...prev,
      [activeSubjectId]: [...updatedHistory, botMsg]
    }));
    setIsThinking(false);
  };

  // --- RENDER: LANDING PAGE ---
  if (view === 'landing') {
    return (
      <div className="min-h-screen font-sans text-ink">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 font-serif text-2xl font-bold text-slate-800">
              <PenTool className="w-6 h-6 text-slate-800" />
              <span>InkSage</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
              <a href="#features" className="hover:text-slate-900">Features</a>
              <a href="#how-it-works" className="hover:text-slate-900">How It Works</a>
              <a href="#privacy" className="hover:text-slate-900">Privacy</a>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-sm font-medium text-stone-600 hover:text-slate-900">Log In</button>
              <Button onClick={handleStartGuestMode} className="bg-slate-900 text-white px-5 py-2 text-sm rounded-full shadow-md hover:bg-slate-700">
                Try Guest Mode
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-grid-paper opacity-30 -z-10"></div>
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-1 text-orange-800 text-xs font-bold uppercase tracking-wide shadow-sm">
                <Lock className="w-3 h-3" /> Private & Secure
              </div>
              <h1 className="text-5xl lg:text-6xl font-serif font-bold leading-tight text-slate-900">
                Your Notes. <br/>
                <span className="relative inline-block">
                  <span className="absolute inset-x-0 bottom-2 h-4 bg-yellow-200 -z-10 transform -rotate-1"></span>
                  Your Private AI Tutor.
                </span>
              </h1>
              <p className="text-lg text-stone-600 max-w-md leading-relaxed">
                Upload your notes, organize them by subject, and get answers backed by <span className="font-bold text-slate-800">exact citations</span> from your content. No hallucinations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button onClick={handleStartGuestMode}>
                  Start Learning Now <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline">See How It Works</Button>
              </div>
              <p className="text-xs text-stone-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Your files stay yours. Nothing trained on public models.
              </p>
            </div>

            {/* 3D / Hero Visual - Professional Product Showcase Animation */}
            <div className="relative h-[600px] w-full flex items-center justify-center hidden lg:flex perspective-[2000px]">
                {/* Background Glow */}
                <div className="absolute w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[100px] -z-10"></div>

                {/* Main Stack Container with 3D rotation */}
                <div className="relative w-[340px] h-[440px] preserve-3d rotate-y-[-12deg] rotate-x-[5deg] transition-transform duration-500 hover:rotate-y-[-5deg] hover:rotate-x-[0deg]">
                    
                    {/* Layer 1: The Backing Folder/Binder */}
                    <div className="absolute inset-0 bg-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] transform translate-z-[-20px] border-2 border-slate-700"></div>
                    <div className="absolute inset-0 bg-slate-800 rounded-2xl transform translate-z-[-19px] translate-x-[2px] translate-y-[2px] opacity-90"></div>

                    {/* Layer 2: The Main Note Paper */}
                    <div className="absolute inset-4 bg-white rounded-lg shadow-xl p-8 flex flex-col gap-5 transform translate-z-[0px] animate-float-slow border border-stone-100">
                        {/* Paper Header */}
                        <div className="flex justify-between items-center border-b-2 border-stone-100 pb-4">
                           <div className="w-32 h-4 bg-stone-200 rounded-sm"></div>
                           <div className="px-2 py-1 bg-red-50 text-red-500 rounded text-[10px] font-bold uppercase tracking-wider border border-red-100">PDF Note</div>
                        </div>
                        
                        {/* Paper Body (Skeleton Lines) */}
                        <div className="space-y-4">
                           <div className="w-full h-2 bg-stone-100 rounded-full"></div>
                           <div className="w-full h-2 bg-stone-100 rounded-full"></div>
                           <div className="w-5/6 h-2 bg-stone-100 rounded-full"></div>
                           
                           {/* Animated Highlight Area */}
                           <div className="w-full h-auto py-1 relative group">
                              <div className="absolute inset-0 bg-yellow-200/40 -skew-x-6 rounded-sm"></div>
                              <div className="w-11/12 h-2 bg-slate-800 rounded-full relative z-10 opacity-80"></div>
                              <div className="mt-2 w-3/4 h-2 bg-slate-800 rounded-full relative z-10 opacity-80"></div>
                           </div>
                           
                           <div className="w-full h-2 bg-stone-100 rounded-full"></div>
                           <div className="w-4/5 h-2 bg-stone-100 rounded-full"></div>
                        </div>

                        {/* Scanning Bar Animation */}
                        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                            <div className="w-full h-16 bg-gradient-to-b from-transparent via-blue-400/10 to-transparent absolute top-0 animate-scan">
                                <div className="w-full h-[1px] bg-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                            </div>
                        </div>
                    </div>

                    {/* Layer 3: Floating Pen */}
                    <div className="absolute -right-8 top-12 w-4 h-48 bg-stone-800 rounded-full shadow-2xl transform translate-z-[40px] rotate-[15deg] animate-float-medium flex flex-col items-center justify-end">
                        <div className="w-full h-12 bg-stone-700 rounded-b-full"></div>
                        <div className="w-1.5 h-4 bg-stone-300 mb-[-8px] rounded-full"></div>
                    </div>

                    {/* Layer 4: AI Answer Pop-up Card */}
                    <div className="absolute top-1/2 -right-40 w-72 bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 transform translate-z-[80px] -translate-y-16 animate-float-fast flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                                <PenTool className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-bold text-slate-900">InkSage Verified</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                           "According to <span className="text-blue-600 font-semibold">Unit_2_Bio.pdf</span>, enzymes lower activation energy..."
                        </p>
                        <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full w-2/3 bg-green-500 rounded-full"></div>
                        </div>
                    </div>

                    {/* Layer 5: Floating Elements */}
                    <div className="absolute -bottom-6 -left-12 w-20 h-20 bg-yellow-300 rounded-lg shadow-lg transform rotate-[-10deg] translate-z-[30px] animate-float-delayed flex items-center justify-center">
                       <span className="text-2xl">✨</span>
                    </div>

                </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
             <div className="text-center max-w-2xl mx-auto mb-16">
               <h2 className="text-3xl font-serif font-bold mb-4">Why InkSage is Different</h2>
               <p className="text-stone-600">Most AI tools guess. InkSage reads your notes and proves its work.</p>
             </div>

             <div className="grid md:grid-cols-2 gap-8">
               {/* Generic */}
               <div className="p-8 rounded-xl bg-stone-50 border border-stone-100 text-stone-400">
                  <div className="flex items-center gap-3 mb-4 opacity-50">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <h3 className="font-bold">Generic AI</h3>
                  </div>
                  <p className="italic">"I think the answer might be this, based on what I saw on the internet in 2023..."</p>
                  <div className="mt-4 text-xs text-red-400 uppercase font-bold tracking-wide">No Source</div>
               </div>

               {/* InkSage */}
               <div className="p-8 rounded-xl bg-paper border-2 border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-800"></div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <h3 className="font-bold text-slate-900">InkSage</h3>
                  </div>
                  <p className="text-slate-800 font-medium">
                    "<Highlighter>The Treaty of Versailles was signed in 1919</Highlighter>, as stated on page 42 of your notes."
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                     <FileText className="w-4 h-4 text-blue-500" />
                     <span className="text-xs text-blue-600 font-bold underline cursor-pointer">History_Ch4.pdf</span>
                  </div>
               </div>
             </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 bg-stone-100 relative">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-serif font-bold mb-12 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "1", title: "Upload Notes", desc: "Drag & drop PDFs, Docs, or PPTs." },
                { step: "2", title: "Organize Folders", desc: "Sort content by subject." },
                { step: "3", title: "Chat & Cite", desc: "Ask questions, get answers with proof." }
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-lg shadow-paper flex flex-col items-center text-center relative group hover:-translate-y-2 transition-transform">
                   <div className="w-12 h-12 bg-slate-800 text-white rounded-full flex items-center justify-center text-xl font-bold font-serif mb-6 shadow-lg">
                     {item.step}
                   </div>
                   <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                   <p className="text-stone-600">{item.desc}</p>
                   {/* Binder clip visual */}
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-stone-300 rounded-t-lg border-x-2 border-t-2 border-stone-400"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-paper-dark">
          <div className="max-w-7xl mx-auto px-6">
             <h2 className="text-3xl font-serif font-bold mb-12 text-center">Built for Focus</h2>
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {FEATURES.map((feat, i) => (
                 <div key={i} className="p-6 bg-white border border-stone-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                   <feat.icon className="w-8 h-8 text-slate-700 mb-4" />
                   <h3 className="font-bold text-lg mb-2">{feat.title}</h3>
                   <p className="text-stone-600 text-sm">{feat.desc}</p>
                 </div>
               ))}
             </div>
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" className="py-24 bg-slate-900 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-slate-900 to-slate-900"></div>
          <div className="max-w-3xl mx-auto px-6 relative z-10">
            <Lock className="w-12 h-12 mx-auto mb-6 text-green-400" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">Your Notes Stay Yours. Always.</h2>
            <p className="text-slate-300 text-lg mb-8">
              We don't train on your data. Guest Mode files are deleted the moment you close the tab.
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>End-to-End Private Session</span>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-paper overflow-hidden">
           <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-3xl font-serif font-bold mb-12 text-center">Students ❤️ InkSage</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {TESTIMONIALS.map((t, i) => (
                  <div key={i} className={`p-6 shadow-lg transform rotate-${(i % 2 === 0) ? '1' : '-1'} bg-white border-b-4 border-r-4 border-stone-200`}>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="w-3 h-3 bg-slate-800 rounded-full shadow-sm"></div>
                    </div>
                    <p className="font-serif text-lg text-slate-800 mb-4 leading-relaxed">"{t.text}"</p>
                    <div className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${t.color} text-slate-900`}>
                      {t.author}
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </section>

        {/* Footer */}
        <footer className="bg-white border-t border-stone-200 py-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-2 font-serif font-bold text-slate-800">
                <PenTool className="w-5 h-5" /> InkSage
             </div>
             <div className="flex gap-6 text-sm text-stone-500">
               <a href="#" className="hover:text-slate-800">Privacy Policy</a>
               <a href="#" className="hover:text-slate-800">Terms of Use</a>
               <a href="#" className="hover:text-slate-800">Contact</a>
             </div>
             <p className="text-stone-400 text-xs">© 2024 InkSage. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  // --- RENDER: APP VIEW ---
  const activeSubject = subjects.find(s => s.id === activeSubjectId);
  const currentMessages = activeSubjectId ? (chatHistory[activeSubjectId] || []) : [];

  return (
    <div className="flex h-screen bg-[#f3f4f6] text-ink font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'block' : 'hidden'} md:block w-64 bg-[#fdfbf7] border-r border-stone-200 flex flex-col h-full absolute md:relative z-40 shadow-xl md:shadow-none`}>
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif font-bold text-lg cursor-pointer" onClick={() => setView('landing')}>
            <ArrowLeft className="w-4 h-4" /> InkSage
          </div>
          <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 px-2">Your Subjects</div>
          {subjects.map(sub => (
             <div 
               key={sub.id}
               onClick={() => { setActiveSubjectId(sub.id); setIsSidebarOpen(false); }}
               className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${activeSubjectId === sub.id ? 'bg-white shadow-sm border border-stone-200' : 'hover:bg-stone-100'}`}
             >
               <div className={`w-3 h-3 rounded-full ${sub.color}`}></div>
               <span className="font-medium text-sm text-slate-700 flex-1 truncate">{sub.name}</span>
               {activeSubjectId === sub.id && <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span>}
             </div>
          ))}
          
          <button 
            onClick={handleCreateSubject}
            className="w-full flex items-center gap-2 p-2 text-stone-500 hover:text-slate-800 hover:bg-stone-100 rounded-lg transition-colors text-sm font-medium mt-2 border border-dashed border-stone-300"
          >
            <FolderPlus className="w-4 h-4" /> New Subject
          </button>
        </div>

        {/* Guest Mode Indicator */}
        <div className="p-4 bg-slate-50 border-t border-stone-200">
          <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             Guest Mode Active
          </div>
          <p className="text-[10px] text-stone-400 leading-tight">
            Files are stored in memory and deleted when you close this tab.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative bg-grid-paper">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur border-b border-stone-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-3">
             <button className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
               <Menu className="w-5 h-5" />
             </button>
             <h2 className="font-serif font-bold text-xl text-slate-800">
               {activeSubject ? activeSubject.name : "Select a Subject"}
             </h2>
          </div>
          
          {/* File Manager (Mini) */}
          <div className="flex items-center gap-4">
            {activeSubject && (
              <>
                <div className="hidden md:flex items-center -space-x-2">
                  {activeSubject.files.slice(0, 3).map(f => (
                    <div key={f.id} className="w-8 h-8 bg-white border border-stone-200 rounded-full flex items-center justify-center shadow-sm text-[10px] font-bold text-slate-600" title={f.name}>
                      {f.name.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                  {activeSubject.files.length > 3 && (
                    <div className="w-8 h-8 bg-slate-100 border border-stone-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600">
                      +{activeSubject.files.length - 3}
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-700 transition-all shadow-md active:translate-y-0.5">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Notes</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.md,.csv,.json" />
                </label>
              </>
            )}
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {!activeSubject ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400">
               <Book className="w-16 h-16 mb-4 opacity-20" />
               <p>Select or create a subject to start studying.</p>
            </div>
          ) : activeSubject.files.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 animate-fadeIn">
               <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                 <Upload className="w-8 h-8 text-stone-300" />
               </div>
               <h3 className="text-lg font-bold text-slate-700 mb-2">No Notes Yet</h3>
               <p className="text-sm max-w-xs text-center mb-6">Upload your class notes (.txt, .md for demo) to start chatting with your personal tutor.</p>
               <label className="text-blue-600 font-medium cursor-pointer hover:underline">
                 Upload a file
                 <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.md,.csv,.json" />
               </label>
            </div>
          ) : (
            <>
              {/* Welcome Message for Subject */}
              {currentMessages.length === 0 && (
                 <div className="bg-paper border border-yellow-200 p-6 rounded-lg shadow-sm max-w-2xl mx-auto mb-8 rotate-1">
                    <h3 className="font-serif font-bold text-lg text-slate-800 mb-2">Ready to study {activeSubject.name}! 🎓</h3>
                    <p className="text-stone-600">I've read your {activeSubject.files.length} files. Ask me anything, and I'll back it up with proof.</p>
                 </div>
              )}

              {/* Messages */}
              {currentMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 sm:p-6 shadow-sm relative ${
                    msg.role === 'user' 
                      ? 'bg-slate-800 text-white rounded-tr-none' 
                      : 'bg-white border border-stone-200 text-slate-800 rounded-tl-none'
                  }`}>
                     {/* Message Text */}
                     <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                       {msg.text}
                     </div>

                     {/* Citations */}
                     {msg.citations && msg.citations.length > 0 && (
                       <div className="mt-4 pt-3 border-t border-stone-100">
                         <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                           <Book className="w-3 h-3" /> Sources Used
                         </p>
                         <div className="flex flex-wrap gap-2">
                           {msg.citations.map((cit, idx) => (
                             <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 flex items-center gap-1">
                               <FileText className="w-3 h-3" /> {cit}
                             </span>
                           ))}
                         </div>
                       </div>
                     )}
                  </div>
                </div>
              ))}
              
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/90 backdrop-blur border-t border-stone-200">
           <div className="max-w-4xl mx-auto relative">
             <textarea 
               value={inputMessage}
               onChange={(e) => setInputMessage(e.target.value)}
               onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
               placeholder={activeSubject ? `Ask InkSage about ${activeSubject.name}...` : "Select a subject first..."}
               disabled={!activeSubject}
               className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-4 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all resize-none h-[60px] hide-scrollbar shadow-inner"
             />
             <button 
               onClick={handleSendMessage}
               disabled={!inputMessage.trim() || !activeSubject || isThinking}
               className="absolute right-2 top-2 bottom-2 p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors shadow-md"
             >
               <Send className="w-4 h-4" />
             </button>
           </div>
           <div className="text-center mt-2">
             <span className="text-[10px] text-stone-400">AI can make mistakes. Always check your original notes.</span>
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
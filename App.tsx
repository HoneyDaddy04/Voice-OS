
import React, { useState, useEffect } from 'react';
import { Entry, EntryType, ViewState, ProcessingResult } from './types';
import { loadEntries, saveEntries, blobToBase64, requestNotificationPermission, scheduleNotification } from './utils';
import { processVoiceInput } from './geminiService';
import { MicButton } from './components/MicButton';
import { IdeaCard, ListCard, ReminderCard, JournalCard, FormCard } from './components/EntryCards';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('SIGN_IN');
  const [selectedTool, setSelectedTool] = useState<EntryType | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setEntries(loadEntries());
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  const handleRecordingComplete = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const base64 = await blobToBase64(blob);
      const result: ProcessingResult = await processVoiceInput(base64, blob.type, selectedTool || undefined);
      
      const newEntry: Entry = {
        id: crypto.randomUUID(),
        type: result.type,
        timestamp: Date.now(),
        content: mapGeminiResultToContent(result)
      };

      setEntries(prev => [newEntry, ...prev]);

      if (result.type === EntryType.REMINDER && result.structuredData.triggerTime) {
        scheduleNotification(result.structuredData.text, result.structuredData.triggerTime);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to process your request. Check your connection or API key.");
    } finally {
      setIsProcessing(false);
    }
  };

  const mapGeminiResultToContent = (result: ProcessingResult) => {
    const data = result.structuredData;
    switch (result.type) {
      case EntryType.LIST:
        return {
          title: data.title || "Voice List",
          items: (data.items || []).map((it: any) => ({ id: crypto.randomUUID(), text: it.text, completed: false }))
        };
      case EntryType.FORM:
        return { title: data.title || "Voice Form", fields: data.fields || [], responses: [] };
      case EntryType.REMINDER:
        return { text: data.text || "Reminder", triggerTime: data.triggerTime || null, notificationStatus: 'pending' as const };
      case EntryType.JOURNAL:
        return { transcript: data.transcript || "", summary: data.summary || "", emotionalTone: data.emotionalTone || "Neutral" };
      default:
        return { transcript: data.transcript || "", summary: data.summary || "", coreIdea: data.coreIdea || "General Idea", tags: data.tags || [] };
    }
  };

  const deleteEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id));
  const updateEntry = (updated: Entry) => setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));

  const renderCard = (entry: Entry) => {
    const props = { entry, onDelete: deleteEntry, onUpdate: updateEntry, key: entry.id };
    switch (entry.type) {
      case EntryType.LIST: return <ListCard {...props} />;
      case EntryType.REMINDER: return <ReminderCard {...props} />;
      case EntryType.JOURNAL: return <JournalCard {...props} />;
      case EntryType.FORM: return <FormCard {...props} />;
      default: return <IdeaCard {...props} />;
    }
  };

  const ToolCard = ({ type, icon, label, color, description }: { type: EntryType, icon: string, label: string, color: string, description: string }) => (
    <button 
      onClick={() => { setSelectedTool(type); setView('TOOL_VIEW'); }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all text-left flex flex-col gap-4 group"
    >
      <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
        <i className={`fas ${icon} text-2xl`}></i>
      </div>
      <div>
        <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight">{label}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </button>
  );

  if (view === 'SIGN_IN') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white text-4xl mb-8 shadow-2xl">
          <i className="fas fa-bolt"></i>
        </div>
        <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">VOICE SUITE</h1>
        <p className="text-slate-500 max-w-sm text-lg mb-12">Capture your thoughts, plans, and reflections with the speed of sound.</p>
        <button 
          onClick={() => setView('DASHBOARD')}
          className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-slate-800 shadow-xl active:scale-95 transition-all"
        >
          Sign In with Voice
        </button>
      </div>
    );
  }

  if (view === 'DASHBOARD') {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <header className="max-w-4xl mx-auto pt-12 px-6 mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">DASHBOARD</h2>
            <p className="text-slate-400 font-medium uppercase text-xs tracking-widest mt-1">Select your tool</p>
          </div>
          <button onClick={() => setView('SIGN_IN')} className="text-slate-400 hover:text-red-500 transition-colors">
            <i className="fas fa-power-off text-xl"></i>
          </button>
        </header>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6">
          <ToolCard type={EntryType.IDEA} icon="fa-lightbulb" label="Ideas" color="bg-blue-500" description="Unstructured thoughts & brainstorms" />
          <ToolCard type={EntryType.LIST} icon="fa-list-check" label="Lists" color="bg-emerald-500" description="To-dos, tasks, and shopping" />
          <ToolCard type={EntryType.REMINDER} icon="fa-bell" label="Reminders" color="bg-amber-500" description="Schedule alerts & future intent" />
          <ToolCard type={EntryType.JOURNAL} icon="fa-book-open" label="Journal" color="bg-rose-500" description="Check-ins & emotional patterns" />
          <ToolCard type={EntryType.FORM} icon="fa-clipboard-list" label="Forms" color="bg-purple-500" description="Structured data collection" />
        </div>
      </div>
    );
  }

  const filteredEntries = entries.filter(e => e.type === selectedTool);

  return (
    <div className="min-h-screen bg-white pb-40">
      <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-40 py-6">
        <div className="max-w-2xl mx-auto px-6 flex items-center justify-between">
          <button onClick={() => { setView('DASHBOARD'); setSelectedTool(null); }} className="text-gray-400 hover:text-gray-800 transition-colors">
            <i className="fas fa-chevron-left text-xl"></i>
          </button>
          <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">{selectedTool} SUITE</h2>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-10 space-y-6">
        {filteredEntries.length === 0 && !isProcessing && (
          <div className="text-center py-20 opacity-30">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-6">
              <i className="fas fa-microphone-slash text-2xl"></i>
            </div>
            <p className="font-bold uppercase tracking-widest text-xs">No entries yet</p>
          </div>
        )}
        <div className="space-y-6">
          {filteredEntries.map(entry => renderCard(entry))}
        </div>
      </main>

      <MicButton onRecordingComplete={handleRecordingComplete} isProcessing={isProcessing} />
    </div>
  );
};

export default App;


import React from 'react';
import { Entry, EntryType, IdeaContent, ListContent, FormContent, ReminderContent, JournalContent } from '../types';
import { formatTimestamp } from '../utils';

interface CardProps {
  entry: Entry;
  onDelete: (id: string) => void;
  onUpdate: (entry: Entry) => void;
}

const CardHeader: React.FC<{ entry: Entry; onDelete: (id: string) => void }> = ({ entry, onDelete }) => (
  <div className="flex justify-between items-start mb-3">
    <div className="flex items-center gap-2">
      <div className={`p-1.5 rounded-lg text-white ${getTypeColor(entry.type)}`}>
        <i className={getTypeIcon(entry.type)}></i>
      </div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">{entry.type}</h3>
        <span className="text-[10px] text-gray-400">{formatTimestamp(entry.timestamp)}</span>
      </div>
    </div>
    <button onClick={() => onDelete(entry.id)} className="text-gray-300 hover:text-red-500 transition-colors">
      <i className="fas fa-trash-alt text-sm"></i>
    </button>
  </div>
);

const getTypeColor = (type: EntryType) => {
  switch (type) {
    case EntryType.REMINDER: return 'bg-amber-500';
    case EntryType.FORM: return 'bg-purple-500';
    case EntryType.LIST: return 'bg-emerald-500';
    case EntryType.JOURNAL: return 'bg-rose-500';
    default: return 'bg-blue-500';
  }
};

const getTypeIcon = (type: EntryType) => {
  switch (type) {
    case EntryType.REMINDER: return 'fas fa-bell';
    case EntryType.FORM: return 'fas fa-clipboard-list';
    case EntryType.LIST: return 'fas fa-list-check';
    case EntryType.JOURNAL: return 'fas fa-book-open';
    default: return 'fas fa-lightbulb';
  }
};

export const IdeaCard: React.FC<CardProps> = ({ entry, onDelete }) => {
  const content = entry.content as IdeaContent;
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <CardHeader entry={entry} onDelete={onDelete} />
      <p className="text-lg font-semibold text-gray-800 mb-2 leading-snug">"{content.coreIdea}"</p>
      <p className="text-sm text-gray-600 mb-4 line-clamp-3 italic">{content.summary}</p>
      <div className="flex flex-wrap gap-1.5">
        {content.tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">#{tag}</span>
        ))}
      </div>
    </div>
  );
};

export const ListCard: React.FC<CardProps> = ({ entry, onDelete, onUpdate }) => {
  const content = entry.content as ListContent;
  
  const toggleItem = (itemId: string) => {
    const newItems = content.items.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdate({ ...entry, content: { ...content, items: newItems } });
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <CardHeader entry={entry} onDelete={onDelete} />
      <h3 className="text-lg font-bold text-gray-800 mb-3">{content.title || "Untitled List"}</h3>
      <div className="space-y-2">
        {content.items.map(item => (
          <div key={item.id} className="flex items-start gap-3 group">
            <button 
              onClick={() => toggleItem(item.id)}
              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200'}`}
            >
              {item.completed && <i className="fas fa-check text-[10px] text-white"></i>}
            </button>
            <span className={`text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ReminderCard: React.FC<CardProps> = ({ entry, onDelete }) => {
  const content = entry.content as ReminderContent;
  const triggerDate = content.triggerTime ? new Date(content.triggerTime) : null;
  
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 -mr-6 -mt-6 rounded-full opacity-50"></div>
      <CardHeader entry={entry} onDelete={onDelete} />
      <div className="space-y-3">
        <p className="text-lg font-semibold text-gray-800">{content.text}</p>
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 w-fit px-3 py-1 rounded-full">
          <i className="fas fa-clock text-xs"></i>
          <span className="text-xs font-bold">
            {triggerDate ? formatTimestamp(triggerDate.getTime()) : "Time not specified"}
          </span>
        </div>
      </div>
    </div>
  );
};

export const JournalCard: React.FC<CardProps> = ({ entry, onDelete }) => {
  const content = entry.content as JournalContent;
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <CardHeader entry={entry} onDelete={onDelete} />
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">
          {content.emotionalTone.toLowerCase().includes('happy') ? '😊' : 
           content.emotionalTone.toLowerCase().includes('sad') ? '😢' : 
           content.emotionalTone.toLowerCase().includes('anxious') ? '😰' : '🧘'}
        </span>
        <span className="text-sm font-bold text-gray-700">{content.emotionalTone}</span>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed italic border-l-4 border-rose-100 pl-4">
        {content.summary}
      </p>
    </div>
  );
};

export const FormCard: React.FC<CardProps> = ({ entry, onDelete }) => {
  const content = entry.content as FormContent;
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <CardHeader entry={entry} onDelete={onDelete} />
      <h3 className="text-lg font-bold text-gray-800 mb-3">{content.title || "Data Form"}</h3>
      <div className="space-y-4">
        {content.fields.map((field, idx) => (
          <div key={idx}>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{field.label}</label>
            <div className="w-full h-10 bg-gray-50 rounded-lg border border-gray-100 flex items-center px-3 text-gray-400 text-sm italic">
              Input field ({field.type})
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-50 flex gap-2">
        <button className="flex-1 bg-purple-600 text-white text-xs font-bold py-2 rounded-xl hover:bg-purple-700 transition-colors">
          Share Form
        </button>
        <button className="flex-1 border border-purple-200 text-purple-600 text-xs font-bold py-2 rounded-xl hover:bg-purple-50 transition-colors">
          View Responses
        </button>
      </div>
    </div>
  );
};

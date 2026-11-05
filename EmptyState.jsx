import { Image as ImageIcon, Lightbulb, PenLine, Video } from 'lucide-react';

const CARDS = [
  { id: 'image', label: 'Generate Image', icon: ImageIcon, tint: 'text-[#1a73e8]' },
  { id: 'video', label: 'Generate Video', icon: Video, tint: 'text-[#9334e6]' },
  { id: 'write', label: 'Help me write', icon: PenLine, tint: 'text-[#d93025]' },
  { id: 'plan', label: 'Plan with me', icon: Lightbulb, tint: 'text-[#e37400]' },
];

export default function EmptyState({ onPick }) {
  return (
    <div className="min-h-full flex flex-col justify-center px-4 sm:px-6 py-8 max-w-3xl mx-auto w-full">
      <h1 className="text-[34px] sm:text-[52px] leading-[1.1] font-semibold tracking-tight text-gradient pb-1">Hello, Light up your day</h1>
      <div
        className="mt-8 sm:mt-10 flex sm:grid sm:grid-cols-4 gap-3 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 sm:mx-0 sm:px-0"
        role="list"
        aria-label="Suggestions"
      >
        {CARDS.map(({ id, label, icon: Icon, tint }) => (
          <button
            key={id}
            role="listitem"
            onClick={() => onPick(id)}
            className="snap-start shrink-0 w-[170px] sm:w-auto h-[132px] sm:h-[150px] rounded-2xl bg-field hover:bg-hover transition-colors p-4 flex flex-col justify-between text-left"
          >
            <span className="text-[15px] leading-snug font-medium">{label}</span>
            <span className="self-end h-10 w-10 rounded-full bg-surface flex items-center justify-center">
              <Icon size={20} className={tint} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

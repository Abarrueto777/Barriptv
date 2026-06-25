'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Buscar..."
      autoFocus
      className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none backdrop-blur-xl transition focus:border-cyan-400/60 focus:bg-white/10"
    />
  );
}

import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', icon: 'dashboard', label: 'Tổng quan' },
  { to: '/patients', icon: 'group', label: 'Bệnh nhân' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-40 bg-black shadow-2xl flex flex-col py-8 px-4 pt-20">
      <div className="mb-8 px-2">
        <h2 className="text-lg font-bold text-slate-100">Hệ thống BME</h2>
        <p className="text-xs text-on-surface-variant uppercase tracking-widest">Giám sát lâm sàng</p>
      </div>
      <nav className="flex-1 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium tracking-wide ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border-r-2 border-cyan-400'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`
            }
          >
            <span className="material-symbols-outlined">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-4">
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all text-sm font-medium tracking-wide">
          <span className="material-symbols-outlined">help</span>
          <span>Trợ giúp</span>
        </a>
      </div>
    </aside>
  );
}

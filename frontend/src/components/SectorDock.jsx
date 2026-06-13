export default function SectorDock({ sectors, activeSector, onSelect }) {
  return (
    <div className="sector-dock">
      {sectors.map((sector, index) => (
        <button
          className={`sector-card ${index === activeSector ? 'active' : ''}`}
          key={sector.key || sector.name}
          onClick={() => onSelect(index)}
        >
          <b>{sector.name}</b>
          <small>{sector.score}/100 · {sector.change > 0 ? '+' : ''}{sector.change}%</small>
          <span className="microbar"><i style={{ width: `${sector.score}%` }} /></span>
        </button>
      ))}
    </div>
  );
}

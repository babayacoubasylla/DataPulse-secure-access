export default function HeatMap() {
  return (
    <div className="heat">
      {Array.from({ length: 35 }).map((_, index) => (
        <span
          className="heat-cell"
          key={index}
          style={{ '--a': ((index * 17) % 55) / 100, '--b': ((index * 29) % 45) / 100 }}
        />
      ))}
    </div>
  );
}

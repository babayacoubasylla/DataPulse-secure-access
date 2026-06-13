export default function ScoreRing({ score }) {
  return (
    <div className="score-ring" style={{ '--score': score }}>
      <strong>{score}</strong>
      <small>/100</small>
    </div>
  );
}

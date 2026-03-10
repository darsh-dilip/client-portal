import React from 'react';
import { scoreToGrade } from '../utils/compliance';

const SIZE = 140;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export default function ComplianceScore({ score }) {
  const { grade, color } = scoreToGrade(score);
  const fill = score === null ? 0 : (score / 100) * CIRC;
  const dash = `${fill} ${CIRC}`;

  const strokeColor = {
    green: '#4ecca3',
    amber: '#e8a83a',
    red:   '#e87070',
    slate: '#8a9bb5',
  }[color];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem' }}>
      <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none"
          stroke="rgba(255,255,255,.07)"
          strokeWidth={STROKE}
        />
        {/* Progress */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none"
          stroke={strokeColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={dash}
          style={{ transition: 'stroke-dasharray .8s ease' }}
        />
        {/* Center text (un-rotated via nested group) */}
        <g transform={`rotate(90, ${SIZE / 2}, ${SIZE / 2})`}>
          <text
            x={SIZE / 2} y={SIZE / 2 - 8}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="28"
            fontFamily="DM Serif Display, serif"
          >
            {score === null ? '—' : score}
          </text>
          <text
            x={SIZE / 2} y={SIZE / 2 + 14}
            textAnchor="middle"
            fill="#8a9bb5"
            fontSize="11"
            fontFamily="DM Sans, sans-serif"
            letterSpacing="1"
          >
            {score === null ? '' : 'OUT OF 100'}
          </text>
        </g>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '.78rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
          Compliance Score
        </div>
        <div style={{
          fontSize: '1.5rem',
          fontFamily: 'var(--font-display)',
          color: strokeColor,
          marginTop: '.1rem',
        }}>
          Grade {grade}
        </div>
      </div>
    </div>
  );
}

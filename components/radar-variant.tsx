'use client';

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';

type Props = { data: { name: string; value: number }[] };

export function RadarVariant({ data }: Props) {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <PolarGrid stroke="rgba(148,163,255,0.18)" />
          <PolarAngleAxis style={{ fontSize: '12px', fill: 'var(--aurex-text-2)' }} tick={{ fill: 'var(--aurex-text-2)' }} dataKey="name" />
          <PolarRadiusAxis angle={90} style={{ fontSize: '11px', fill: 'var(--aurex-text-3)' }} tick={{ fill: 'var(--aurex-text-3)' }} stroke="rgba(148,163,255,0.18)" />
          <Radar dataKey="value" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.4} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

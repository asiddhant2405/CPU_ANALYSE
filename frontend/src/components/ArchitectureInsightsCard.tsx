import React from 'react';
import { ArchitectureInsights } from '../types/api';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  AlertTriangle,
  BookOpen,
  Cpu,
  Layers,
  ShieldAlert,
} from 'lucide-react';

interface ArchitectureInsightsCardProps {
  insights: ArchitectureInsights;
}

export const ArchitectureInsightsCard: React.FC<ArchitectureInsightsCardProps> = ({ insights }) => {
  return (
    <div className="bg-[#0D1322] border border-cyan-800/40 rounded-xl overflow-hidden shadow-xl mt-6">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-[#0E172E] to-[#0A1020] border-b border-cyan-800/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-700/50 text-cyan-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Architecture Insights & COA Evaluation
            </h3>
            <p className="text-xs text-cyan-300/80">
              Curriculum-aligned analysis answering key questions for viva evaluation
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-900/40 text-cyan-300 border border-cyan-700/50">
          Faculty Evaluation Panel Ready
        </span>
      </div>

      <div className="p-5 space-y-6 text-sm">
        {/* Row 1: Objective & Controlled Variables */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#090D1A] p-3.5 rounded-lg border border-slate-800/80">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> 1. Investigation Goal
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">{insights.investigation_goal}</p>
          </div>

          <div className="bg-[#090D1A] p-3.5 rounded-lg border border-slate-800/80">
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> 2. Independent Variable
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">{insights.independent_variable}</p>
          </div>

          <div className="bg-[#090D1A] p-3.5 rounded-lg border border-slate-800/80">
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> 3. Controlled Constants
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">{insights.controlled_constants}</p>
          </div>
        </div>

        {/* Relevant COA Concepts Badges */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Relevant COA Curriculum Concepts
          </h4>
          <div className="flex flex-wrap gap-2">
            {insights.relevant_coa_concepts.map((concept, idx) => (
              <span
                key={idx}
                className="text-xs px-3 py-1 rounded-md bg-slate-800/80 text-cyan-200 border border-slate-700 font-medium"
              >
                {concept}
              </span>
            ))}
          </div>
        </div>

        {/* Architectural Mechanisms Explanation */}
        <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800">
          <h4 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" /> Underlying Microarchitectural Mechanism
          </h4>
          <p className="text-slate-200 text-xs leading-relaxed">{insights.architectural_mechanisms}</p>
        </div>

        {/* What this Proves vs What this Does NOT Prove (Strict Academic Rigor) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* What This Proves */}
          <div className="bg-emerald-950/20 border border-emerald-800/50 rounded-lg p-4">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              What This Experiment Proves
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {insights.what_this_proves.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What This Does NOT Prove */}
          <div className="bg-rose-950/20 border border-rose-800/50 rounded-lg p-4">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              What This Experiment Does NOT Prove
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {insights.what_this_does_not_prove.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Academic Conclusion */}
        <div className="p-4 bg-gradient-to-r from-blue-950/30 to-indigo-950/30 border border-blue-800/40 rounded-lg">
          <h4 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-blue-400" /> Student Viva Conclusion
          </h4>
          <p className="text-slate-200 text-xs leading-relaxed italic">
            "{insights.academic_conclusion}"
          </p>
        </div>
      </div>
    </div>
  );
};

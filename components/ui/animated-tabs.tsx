'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedTabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function AnimatedTabs({ tabs, activeTab, onTabChange, className }: AnimatedTabsProps) {
  return (
    <div className={cn("relative flex bg-slate-800/50 border border-slate-700 rounded-lg p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative z-10 flex-1 px-4 py-2 text-sm font-medium transition-colors duration-200",
            activeTab === tab.id
              ? "text-white"
              : "text-slate-300 hover:text-white"
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-blue-600 rounded-md"
              initial={false}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
              style={{ zIndex: -1 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

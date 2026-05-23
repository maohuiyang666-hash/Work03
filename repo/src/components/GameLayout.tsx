import type { ReactNode } from 'react';

interface GameLayoutProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
}

export const GameLayout = ({ leftPanel, centerPanel, rightPanel }: GameLayoutProps) => (
  <div className="flex flex-wrap gap-4 justify-center">
    {leftPanel}
    {centerPanel}
    {rightPanel}
  </div>
);

import type { ReactNode } from 'react';

interface GameLayoutProps {
  children: ReactNode;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ children }) => {
  return (
    <div
      className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 47px, #e8d5c4 48px), repeating-linear-gradient(90deg, transparent, transparent 47px, #e8d5c4 48px)',
      }}
    >
      {children}
    </div>
  );
};

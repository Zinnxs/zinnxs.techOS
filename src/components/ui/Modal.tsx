import React from 'react';
import { cn } from '../../lib/utils';
import { X, Minus, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const maxWidthClass = {
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  }[size];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0 }}
              className={cn(
                "hud-panel w-full pointer-events-auto flex flex-col max-h-[90vh]",
                maxWidthClass
              )}
            >
              {/* Fake Window Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-hud-border bg-hud-panel">
                <div className="flex items-center gap-2">
                  <span className="text-hud-accent font-mono text-xs">&gt;_</span>
                  <h3 className="font-display font-bold text-sm tracking-wider text-hud-text uppercase">
                    {title}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-hud-accent/20 text-hud-muted hover:text-hud-accent transition-colors">
                    <Minus size={14} />
                  </button>
                  <button className="p-1 hover:bg-hud-accent/20 text-hud-muted hover:text-hud-accent transition-colors">
                    <Square size={12} />
                  </button>
                  <button 
                    onClick={onClose}
                    className="p-1 hover:bg-hud-danger/20 text-hud-muted hover:text-hud-danger transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                {children}
              </div>

              {footer && (
                <div className="p-4 border-t border-hud-border bg-hud-bg/50 flex justify-end gap-3">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

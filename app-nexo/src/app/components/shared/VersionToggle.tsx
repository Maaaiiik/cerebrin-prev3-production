import { useState } from 'react';
import { Rocket, FlaskConical, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Version = 'v3' | 'full';

interface VersionToggleProps {
  version: Version;
  onVersionChange: (version: Version) => void;
}

export function VersionToggle({ version, onVersionChange }: VersionToggleProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div 
      initial={false}
      animate={{ width: isExpanded ? 'auto' : '52px' }}
      className="fixed top-4 right-4 z-[100] flex items-center gap-2 p-1.5 rounded-xl bg-card/95 backdrop-blur-md border border-border shadow-2xl overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <button
              onClick={() => onVersionChange('v3')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                ${version === 'v3'
                  ? 'bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
            >
              <Rocket className="w-4 h-4" />
              v3.0
            </button>
            
            <button
              onClick={() => onVersionChange('full')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                ${version === 'full'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
            >
              <FlaskConical className="w-4 h-4" />
              Full Beta
            </button>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              title="Minimizar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(true)}
            className={`
              p-2.5 rounded-lg transition-all duration-200
              ${version === 'v3'
                ? 'bg-gradient-to-r from-violet-600 to-violet-500 text-white'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
              }
            `}
            title={version === 'v3' ? 'v3.0' : 'Full Beta'}
          >
            {version === 'v3' ? <Rocket className="w-5 h-5" /> : <FlaskConical className="w-5 h-5" />}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

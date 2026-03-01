'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface ZapProgressProps {
  currentStep: number;
  amount: string;
  token: string;
}

const zapSteps = [
  {
    id: 0,
    title: 'Bundling Assets',
    description: 'Preparing your tokens for cross-chain transfer',
  },
  {
    id: 1,
    title: 'Initiating Bridge',
    description: 'Calling bridgeAndCall() on AggLayer',
  },
  {
    id: 2,
    title: 'Crossing AggLayer',
    description: 'Atomic transfer in progress...',
  },
  {
    id: 3,
    title: 'Depositing on zkEVM',
    description: 'Executing deposit into yield vault',
  },
  {
    id: 4,
    title: 'Complete',
    description: 'Your funds are now earning yield!',
  },
];

export function ZapProgress({ currentStep, amount, token }: ZapProgressProps) {
  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="relative h-2 bg-dark-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / (zapSteps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5 }}
          className="absolute inset-y-0 left-0 progress-fill rounded-full"
        />
        
        {/* Animated particles on progress bar */}
        <motion.div
          animate={{ x: ['0%', '100%'] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          style={{ left: `${Math.min((currentStep / (zapSteps.length - 1)) * 100 - 20, 80)}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {zapSteps.map((step, index) => {
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;
          const isPending = currentStep < index;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                isCurrent ? 'glass' : ''
              }`}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-success-400" />
                  </motion.div>
                )}
                {isCurrent && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="w-5 h-5 text-accent-400" />
                  </motion.div>
                )}
                {isPending && (
                  <Circle className="w-5 h-5 text-dark-600" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${
                  isCompleted ? 'text-success-400' :
                  isCurrent ? 'text-white' :
                  'text-dark-500'
                }`}>
                  {step.title}
                </p>
                <p className={`text-sm ${
                  isCurrent ? 'text-dark-300' : 'text-dark-600'
                }`}>
                  {step.description}
                </p>
              </div>

              {/* Checkmark animation for completed steps */}
              {isCompleted && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-dark-500"
                >
                  ✓
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Live Transaction Info */}
      {currentStep >= 1 && currentStep < 4 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-accent-500/10 rounded-xl border border-accent-500/20"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-400">Bridging</span>
            <span className="text-white font-mono">{amount} {token}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-dark-800 rounded-full overflow-hidden">
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="h-full w-1/2 bg-gradient-to-r from-accent-500 via-primary-500 to-cyan-500"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Network visualization */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <motion.div
          animate={currentStep >= 1 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: currentStep === 1 ? Infinity : 0 }}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            currentStep >= 1 ? 'bg-purple-500/20 ring-2 ring-purple-500' : 'bg-dark-800'
          }`}
        >
          <span className="text-xl">🟣</span>
        </motion.div>

        <div className="flex-1 max-w-[100px] h-0.5 bg-dark-700 relative overflow-hidden rounded-full">
          {currentStep >= 2 && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500"
            />
          )}
          {currentStep === 2 && (
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 w-1/3 bg-white/50"
            />
          )}
        </div>

        <motion.div
          animate={currentStep >= 3 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: currentStep === 3 ? Infinity : 0 }}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            currentStep >= 3 ? 'bg-cyan-500/20 ring-2 ring-cyan-500' : 'bg-dark-800'
          }`}
        >
          <span className="text-xl">🔵</span>
        </motion.div>
      </div>

      <div className="flex justify-between text-xs text-dark-500 px-2">
        <span>Polygon PoS</span>
        <span>zkEVM</span>
      </div>
    </div>
  );
}

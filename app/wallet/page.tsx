'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
  IconArrowLeft,
  IconWallet,
  IconCreditCard,
  IconPlus,
  IconHistory,
  IconCoins,
} from '@tabler/icons-react';

export default function WalletPage() {
  const router = useRouter();
  const [balance] = useState(0);
  const [transactions] = useState([]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-700">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors"
        >
          <IconArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Your Wallet</h1>
        <div className="w-10 h-10"></div>
      </header>

      <main className="p-4">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Total Balance</h2>
            <IconWallet className="w-6 h-6" />
          </div>
          <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
          <p className="text-blue-100 text-sm mt-2">Available for withdrawal</p>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button className="bg-slate-800 hover:bg-slate-700 rounded-xl p-4 flex flex-col items-center space-y-2 transition-colors">
            <IconPlus className="w-6 h-6 text-green-400" />
            <span className="text-sm font-medium">Add Money</span>
          </button>
          <button className="bg-slate-800 hover:bg-slate-700 rounded-xl p-4 flex flex-col items-center space-y-2 transition-colors">
            <IconCoins className="w-6 h-6 text-yellow-400" />
            <span className="text-sm font-medium">Withdraw</span>
          </button>
        </div>

        {/* Transaction History */}
        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-4">
            <IconHistory className="w-5 h-5 text-slate-400" />
            <h3 className="font-medium">Recent Transactions</h3>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Transaction items would go here */}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

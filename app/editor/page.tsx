'use client';

import { motion } from 'framer-motion';

export default function EditorPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto py-8"
    >
      <h1 className="text-4xl font-bold mb-4">PDF Editor</h1>
      <p className="text-muted-foreground">
        Editor page - Coming soon!
      </p>
    </motion.div>
  );
} 
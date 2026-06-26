import React, { createContext, useContext, ReactNode } from 'react';
import { ZinnxsDB } from '../types';
import { useDB as useLocalStorageDB } from './db';

interface DBContextType {
  db: ZinnxsDB;
  updateDB: (updater: (prev: ZinnxsDB) => ZinnxsDB) => void;
}

const DBContext = createContext<DBContextType | undefined>(undefined);

export function DBProvider({ children }: { children: ReactNode }) {
  const { db, updateDB } = useLocalStorageDB();

  return (
    <DBContext.Provider value={{ db, updateDB }}>
      {children}
    </DBContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(DBContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within a DBProvider');
  }
  return context;
}

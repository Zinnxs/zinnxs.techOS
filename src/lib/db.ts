import { useState, useEffect } from 'react';
import { ZinnxsDB } from '../types';

const DB_KEY = 'zinnxs_tech_db';

const defaultDB: ZinnxsDB = {
  clientes: [],
  ordens: [],
  servicos: [],
  estoque: [],
  movimentacoes: [],
  arquivos: [],
  lastOS: 0,
};

export function loadDB(): ZinnxsDB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return defaultDB;
    const parsed = JSON.parse(raw);
    return { ...defaultDB, ...parsed };
  } catch (e) {
    console.error("Failed to load DB", e);
    return defaultDB;
  }
}

export function saveDB(db: ZinnxsDB) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.error("Failed to save DB", e);
  }
}

export function useDB() {
  const [db, setDb] = useState<ZinnxsDB>(loadDB());

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const updateDB = (updater: (prev: ZinnxsDB) => ZinnxsDB) => {
    setDb((prev) => updater(prev));
  };

  return { db, updateDB };
}

// Utility to generate IDs
export const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Formatting utils
export const formatBRL = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  try {
    // Handling simple YYYY-MM-DD
    if (dateString.length === 10) {
      const [y, m, d] = dateString.split('-');
      return `${d}/${m}/${y}`;
    }
    // Handling ISO strings
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
};

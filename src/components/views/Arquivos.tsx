import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { useAppContext } from '../../lib/context';
import { generateId } from '../../lib/db';
import { motion, AnimatePresence } from 'motion/react';
import { Search, UploadCloud, FileText, Image as ImageIcon, File, Film, X, Download, Trash2 } from 'lucide-react';
import { Arquivo } from '../../types';

export function Arquivos() {
  const { db, updateDB } = useAppContext();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<Arquivo | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const mime = file.type || '';
    if (mime.startsWith('image/')) return 'imagem';
    if (mime.startsWith('video/')) return 'video';
    if (ext === 'pdf') return 'pdf';
    if (['xlsx', 'xls', 'csv'].includes(ext)) return 'planilha';
    if (['doc', 'docx', 'txt'].includes(ext)) return 'documento';
    return 'outro';
  };

  const getFileIcon = (tipo: string) => {
    switch (tipo) {
      case 'imagem': return <ImageIcon size={24} className="text-hud-accent" />;
      case 'video': return <Film size={24} className="text-purple-400" />;
      case 'pdf': return <FileText size={24} className="text-hud-danger" />;
      case 'planilha': return <FileText size={24} className="text-teal-400" />;
      default: return <File size={24} className="text-hud-muted" />;
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const max = 5 * 1024 * 1024; // Limit to 5MB for local storage safety
    
    Array.from(files).forEach(file => {
      if (file.size > max) {
        alert(`${file.name}: Muito grande. Máx 5MB para esta demo.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target?.result) return;
        const newFile: Arquivo = {
          id: generateId(),
          nome: file.name,
          tipo: getFileType(file),
          mime: file.type,
          tamanho: file.size,
          dataUrl: e.target.result as string,
          createdAt: new Date().toISOString()
        };
        
        updateDB(prev => ({
          ...prev,
          arquivos: [newFile, ...prev.arquivos]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const remove = (id: string) => {
    updateDB(prev => ({
      ...prev,
      arquivos: prev.arquivos.filter(a => a.id !== id)
    }));
    setDeletingId(null);
  };

  const filtered = db.arquivos.filter(a => 
    a.nome.toLowerCase().includes(search.toLowerCase()) && 
    (filter === 'todos' || a.tipo === filter)
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-7xl mx-auto"
    >
      <header className="mb-8 border-b border-hud-border pb-4">
        <h1 className="font-display font-black text-3xl text-hud-text tracking-widest uppercase mb-1 flex items-center gap-3">
          <span className="text-hud-accent">_</span>Arquivos
        </h1>
        <p className="font-mono text-xs text-hud-muted tracking-widest uppercase">
          // DB.STORAGE · Armazenamento Local
        </p>
      </header>

      {/* DROPZONE */}
      <div 
        className={cn(
          "hud-panel p-8 flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer relative overflow-hidden mb-8 group",
          isDragging ? "border-hud-accent bg-hud-accent/10" : "border-hud-border hover:border-hud-accent hover:bg-hud-accent/5"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <input 
          type="file" 
          multiple 
          className="absolute inset-0 opacity-0 cursor-pointer z-10" 
          onChange={(e) => handleFiles(e.target.files)}
        />
        <UploadCloud size={48} className={cn("mb-4 transition-colors", isDragging ? "text-hud-accent" : "text-hud-muted group-hover:text-hud-accent")} />
        <h3 className="font-display font-bold text-lg text-hud-text tracking-widest uppercase mb-2">
          UPLINK_DATA
        </h3>
        <p className="font-mono text-xs text-hud-muted tracking-widest uppercase text-center max-w-md">
          ARRASTE ARQUIVOS AQUI OU CLIQUE PARA SELECIONAR. (LIMITE 5MB/ARQUIVO NESTA DEMO).
        </p>
        
        {/* Scanline effect on hover/drag */}
        <div className={cn("absolute inset-0 pointer-events-none opacity-0 transition-opacity bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,93,48,0.1)_2px,rgba(0,93,48,0.1)_4px)]", isDragging || "group-hover:opacity-100")} />
      </div>

      <div className="hud-panel mb-6 flex flex-col md:flex-row items-center gap-4 p-4">
        <div className="relative w-full md:w-auto flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-hud-muted" size={16} />
          <input 
            type="text" 
            placeholder="BUSCAR NOME DE ARQUIVO..." 
            className="hud-input pl-10 uppercase w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          {['todos', 'pdf', 'imagem', 'video', 'planilha', 'documento'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase border whitespace-nowrap transition-colors",
                filter === f 
                  ? "bg-hud-accent/20 border-hud-accent text-hud-accent" 
                  : "bg-transparent border-hud-border text-hud-muted hover:border-hud-accent/50 hover:text-hud-text"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* FILES GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center text-hud-muted font-mono text-xs uppercase hud-panel">
            [ MEMÓRIA VAZIA ]
          </div>
        ) : (
          filtered.map(f => (
            <div 
              key={f.id} 
              className="hud-panel p-3 flex flex-col items-center justify-center text-center cursor-pointer group hover:border-hud-accent transition-colors relative"
              onClick={() => f.tipo === 'imagem' ? setPreviewFile(f) : alert("Preview suportado apenas para imagens.")}
            >
              {deletingId === f.id ? (
                <button 
                  className="absolute top-1 right-1 p-1 bg-hud-danger/20 border border-hud-danger text-hud-danger transition-colors z-10 font-mono text-[8px] uppercase"
                  onClick={(e) => { e.stopPropagation(); remove(f.id); }}
                >
                  Confirma?
                </button>
              ) : (
                <button 
                  className="absolute top-1 right-1 p-1 text-hud-muted hover:text-hud-danger hover:bg-hud-danger/20 transition-colors z-10"
                  onClick={(e) => { e.stopPropagation(); setDeletingId(f.id); }}
                >
                  <Trash2 size={12} />
                </button>
              )}
              
              <div className="w-16 h-16 mb-3 flex items-center justify-center border border-hud-border group-hover:border-hud-accent/50 transition-colors bg-hud-bg overflow-hidden">
                {f.tipo === 'imagem' ? (
                  <img src={f.dataUrl} alt={f.nome} className="w-full h-full object-cover" />
                ) : (
                  getFileIcon(f.tipo)
                )}
              </div>
              
              <div className="w-full">
                <p className="font-mono text-[9px] text-hud-text truncate uppercase" title={f.nome}>
                  {f.nome}
                </p>
                <p className="font-mono text-[8px] text-hud-muted uppercase mt-1">
                  {formatBytes(f.tamanho)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* LIGHTBOX FOR IMAGES */}
      <AnimatePresence>
        {previewFile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setPreviewFile(null)}
          >
            <div className="absolute top-4 right-4 flex gap-4">
              <a 
                href={previewFile.dataUrl} 
                download={previewFile.nome}
                className="p-3 bg-hud-panel border border-hud-border text-hud-text hover:border-hud-accent hover:text-hud-accent transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={20} />
              </a>
              <button 
                className="p-3 bg-hud-panel border border-hud-border text-hud-text hover:border-hud-danger hover:text-hud-danger transition-colors"
                onClick={() => setPreviewFile(null)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="max-w-5xl max-h-[80vh] relative border border-hud-border bg-hud-bg p-2 shadow-[0_0_50px_rgba(0,93,48,0.2)]" onClick={(e) => e.stopPropagation()}>
              <img src={previewFile.dataUrl} alt={previewFile.nome} className="max-w-full max-h-[75vh] object-contain" />
              <div className="absolute bottom-4 left-4 bg-hud-panel/80 backdrop-blur-md px-3 py-1.5 border border-hud-border font-mono text-xs text-hud-accent uppercase">
                {previewFile.nome}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

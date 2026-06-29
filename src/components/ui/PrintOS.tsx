import React from 'react';
import { createPortal } from 'react-dom';
import { OS, Cliente } from '../../types';
import { formatBRL, formatDate } from '../../lib/db';
import { X, Printer } from 'lucide-react';
// @ts-ignore
import logoImg from '../../logo.png';

interface PrintOSProps {
  os: OS | null;
  cliente: Cliente | null;
  onClose: () => void;
}

export function PrintOS({ os, cliente, onClose }: PrintOSProps) {
  if (!os) return null;

  const handlePrint = () => {
    window.print();
  };

  // Printable layout rendered inside document.body via Portal
  const printLayout = (
    <div id="print-root" className="print-only font-sans p-8 max-w-[800px] mx-auto bg-white text-black text-sm leading-relaxed">
      {/* OS Header */}
      <div className="border-b-2 border-emerald-600 pb-4 mb-6 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <img src={logoImg} alt="ZINNXS Tech Logo" className="w-14 h-14 object-contain shrink-0" referrerPolicy="no-referrer" />
          <div>
            <h1 className="text-2xl font-black tracking-widest uppercase text-black">
              ZINNXS <span className="text-emerald-700">TECH</span>
            </h1>
            <p className="text-xs text-gray-600 uppercase tracking-widest font-mono">// SOLUÇÕES EM TECNOLOGIA E SERVIÇOS</p>
            <p className="text-xs text-gray-500 mt-1">Contato: contato@zinnxs.tech | (11) 99999-9999</p>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-emerald-600 text-white px-4 py-2 font-mono font-bold text-lg inline-block uppercase tracking-wider">
            OS: {os.codigo}
          </div>
          <p className="text-xs text-gray-600 mt-1 font-mono uppercase">SITUAÇÃO: <span className="text-emerald-700 font-bold">{os.situacao}</span></p>
        </div>
      </div>

      {/* Basic OS Dates */}
      <div className="grid grid-cols-2 gap-4 border border-gray-300 p-3 bg-gray-50 mb-6 font-mono text-xs">
        <div>
          <span className="font-bold text-gray-700">DATA DE ENTRADA:</span> {formatDate(os.dataInicio)}
        </div>
        <div>
          <span className="font-bold text-gray-700">PREVISÃO DE ENTREGA:</span> {os.dataEntrega ? formatDate(os.dataEntrega) : 'NÃO DEFINIDA'}
        </div>
      </div>

      {/* Customer Info */}
      <div className="border border-gray-300 mb-6">
        <div className="bg-gray-100 px-3 py-1.5 font-bold border-b border-gray-300 uppercase tracking-wider text-xs text-emerald-800">
          DADOS DO CLIENTE
        </div>
        <div className="p-3 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
          <div>
            <span className="font-bold text-gray-700">NOME:</span> <span className="uppercase">{cliente?.nome || '—'}</span>
          </div>
          <div>
            <span className="font-bold text-gray-700">CPF:</span> <span>{cliente?.cpf || '—'}</span>
          </div>
          <div>
            <span className="font-bold text-gray-700">TELEFONE:</span> <span>{cliente?.telefone || '—'}</span>
          </div>
          <div>
            <span className="font-bold text-gray-700">E-MAIL:</span> <span className="lowercase">{cliente?.email || '—'}</span>
          </div>
          <div className="col-span-2">
            <span className="font-bold text-gray-700">ENDEREÇO:</span>{' '}
            <span className="uppercase">
              {[
                cliente?.endereco,
                cliente?.numero ? `Nº ${cliente?.numero}` : '',
                cliente?.bairro,
                cliente?.cep ? `CEP: ${cliente?.cep}` : '',
              ]
                .filter(Boolean)
                .join(', ') || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* OS Description & Technical Info */}
      <div className="border border-gray-300 mb-6">
        <div className="bg-gray-100 px-3 py-1.5 font-bold border-b border-gray-300 uppercase tracking-wider text-xs text-emerald-800">
          DETALHES DO ATENDIMENTO
        </div>
        <div className="p-3 grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
          <div className="col-span-2">
            <span className="font-bold text-gray-700 block mb-1">MOTIVO DO CHAMADO / SINTOMAS:</span>
            <p className="bg-gray-50 p-2.5 border border-gray-200 uppercase whitespace-pre-wrap rounded-xs text-gray-900">
              {os.motivo || 'NÃO ESPECIFICADO'}
            </p>
          </div>
          <div className="col-span-2">
            <span className="font-bold text-gray-700 block mb-1">SERVIÇO SOLICITADO:</span>
            <p className="bg-gray-50 p-2.5 border border-gray-200 uppercase whitespace-pre-wrap rounded-xs text-gray-900">
              {os.servico || 'NÃO ESPECIFICADO'}
            </p>
          </div>
          <div>
            <span className="font-bold text-gray-700">TÉCNICO RESPONSÁVEL:</span>{' '}
            <span className="uppercase text-gray-950 font-bold">{os.responsavel || '—'}</span>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="border border-gray-300 mb-6">
        <div className="bg-gray-100 px-3 py-1.5 font-bold border-b border-gray-300 uppercase tracking-wider text-xs text-emerald-800">
          PRODUTOS, PEÇAS E MÃO DE OBRA
        </div>
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-300">
              <th className="p-2 font-bold text-gray-700 w-16 text-center">QTD</th>
              <th className="p-2 font-bold text-gray-700">DESCRIÇÃO</th>
              <th className="p-2 font-bold text-gray-700 text-right w-28">VALOR UNIT.</th>
              <th className="p-2 font-bold text-gray-700 text-right w-28">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {os.produtos && os.produtos.length > 0 ? (
              os.produtos.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50/50">
                  <td className="p-2 text-center font-mono font-bold text-emerald-800">{item.qtd}</td>
                  <td className="p-2 uppercase">{item.descricao}</td>
                  <td className="p-2 text-right font-mono text-gray-600">{formatBRL(item.valor)}</td>
                  <td className="p-2 text-right font-mono font-bold text-gray-900">{formatBRL(item.qtd * item.valor)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500 italic uppercase font-sans">
                  Nenhum item ou peça adicionada a esta ordem.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Financial Summary */}
      <div className="flex justify-end mb-8">
        <div className="w-64 border border-gray-300 text-xs">
          <div className="p-2 flex justify-between border-b border-gray-200 text-gray-600">
            <span className="font-bold">SUBTOTAL PEÇAS/SERV:</span>
            <span className="font-mono">
              {formatBRL((os.produtos || []).reduce((acc, i) => acc + i.qtd * i.valor, 0))}
            </span>
          </div>
          <div className="p-2 flex justify-between border-b border-gray-200 text-red-600">
            <span className="font-bold">DESCONTO:</span>
            <span className="font-mono">-{formatBRL(os.desconto || 0)}</span>
          </div>
          <div className="p-2 flex justify-between bg-emerald-50 text-emerald-950 font-bold text-sm">
            <span>TOTAL GERAL:</span>
            <span className="font-mono">{formatBRL(os.valorTotal || 0)}</span>
          </div>
        </div>
      </div>

      {/* Notes / Remarks */}
      {os.observacoes && (
        <div className="border border-gray-300 p-3 mb-8 text-xs bg-gray-50">
          <span className="font-bold text-gray-700 block mb-1 uppercase font-mono text-[9px] text-emerald-800 tracking-wider">// OBSERVAÇÕES:</span>
          <p className="whitespace-pre-wrap uppercase text-gray-800">{os.observacoes}</p>
        </div>
      )}

      {/* Signature and Terms */}
      <div className="mt-12 text-[10px] text-gray-600 leading-relaxed uppercase border-t border-gray-300 pt-4 mb-16">
        <p className="mb-8 text-center italic text-gray-500">
          Declaro estar ciente dos termos de prestação de serviços, garantia de peças aplicadas e dos valores contidos nesta ordem.
        </p>
        <div className="grid grid-cols-2 gap-12 mt-12">
          <div className="text-center">
            <div className="border-b border-black w-48 mx-auto mb-1"></div>
            <p className="font-bold text-gray-800">ASSINATURA DO TÉCNICO</p>
            <p className="text-[8px] text-gray-500">ZINNXS TECH</p>
          </div>
          <div className="text-center">
            <div className="border-b border-black w-48 mx-auto mb-1"></div>
            <p className="font-bold text-gray-800">ASSINATURA DO CLIENTE</p>
            <p className="text-[8px] text-gray-500">AUTORIZO O SERVIÇO</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* On-Screen Beautiful Pure-Light Paper Preview modal */}
      <div className="fixed inset-0 bg-black/85 z-[90] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
        <div className="hud-panel w-full max-w-3xl flex flex-col my-8 max-h-[90vh]">
          {/* Modal header with controls */}
          <div className="p-4 border-b border-hud-border flex justify-between items-center bg-hud-bg/30">
            <div className="flex items-center gap-2">
              <Printer className="text-hud-accent animate-pulse" size={16} />
              <h3 className="font-display font-black tracking-widest text-sm uppercase text-hud-text">
                Visualização de OS - {os.codigo}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="hud-button-primary py-1.5 px-4 text-[10px]"
                title="Imprimir ou Salvar como PDF"
              >
                <Printer size={13} />
                IMPRIMIR / PDF
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-hud-danger/10 border border-hud-border/40 hover:border-hud-danger/20 text-hud-muted hover:text-hud-danger transition-all bg-hud-bg/50"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Modal body (a high-fidelity responsive preview scroll area styled as a clean white desk paper) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-200 font-sans custom-scrollbar text-gray-800">
            {/* Real White Paper Sheet */}
            <div className="bg-white border border-gray-300 p-6 sm:p-10 max-w-[700px] mx-auto text-xs space-y-6 shadow-xl text-gray-800 rounded-sm relative">
              {/* Draft/Preview badge */}
              <div className="absolute top-2 right-2 px-1.5 py-0.5 border border-emerald-600/30 text-[8px] font-mono font-bold text-emerald-700 tracking-widest rounded-xs bg-emerald-50/50 uppercase select-none">
                PREVIEW IMPRESSÃO
              </div>

              {/* Header */}
              <div className="border-b-2 border-emerald-600 pb-4 flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={logoImg} alt="ZINNXS Tech Logo" className="w-14 h-14 object-contain shrink-0" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-sans font-black tracking-widest text-xl text-gray-900 uppercase">
                      ZINNXS<span className="text-emerald-600">TECH</span>
                    </h4>
                    <p className="font-mono text-[9px] text-gray-500 mt-0.5 uppercase tracking-widest">// SOLUÇÕES EM TECNOLOGIA E SERVIÇOS</p>
                    <p className="text-[10px] text-gray-500 mt-1">contato@zinnxs.tech | (11) 99999-9999</p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="bg-emerald-600 text-white px-3 py-1.5 font-mono font-bold text-sm tracking-wider inline-block uppercase">
                    OS: {os.codigo}
                  </div>
                  <div className="text-gray-600 text-[10px] mt-1.5 font-mono uppercase">
                    SITUAÇÃO: <span className="text-emerald-700 font-bold">{os.situacao}</span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 border border-gray-200 p-3 font-mono text-[10px] text-gray-700">
                <div>
                  <span className="font-bold text-gray-600 uppercase">DATA INÍCIO:</span> <span>{formatDate(os.dataInicio)}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-600 uppercase">DATA ENTREGA:</span> <span>{os.dataEntrega ? formatDate(os.dataEntrega) : 'NÃO DEFINIDA'}</span>
                </div>
              </div>

              {/* Customer */}
              <div className="border border-gray-300">
                <div className="bg-gray-100 px-3 py-1.5 font-mono text-[10px] text-emerald-800 font-bold tracking-wider border-b border-gray-300 uppercase">
                  DADOS DO CLIENTE
                </div>
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-800 text-xs">
                  <div>
                    <span className="font-bold text-gray-600 uppercase">CLIENTE:</span> <span className="font-bold uppercase ml-1 text-gray-950">{cliente?.nome || '—'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-600 uppercase">CPF:</span> <span className="font-mono ml-1">{cliente?.cpf || '—'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-600 uppercase">TELEFONE:</span> <span className="font-mono ml-1">{cliente?.telefone || '—'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-600 uppercase">EMAIL:</span> <span className="lowercase ml-1 text-gray-600">{cliente?.email || '—'}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-bold text-gray-600 uppercase">ENDEREÇO:</span>{' '}
                    <span className="uppercase ml-1 text-gray-850">
                      {[
                        cliente?.endereco,
                        cliente?.numero ? `Nº ${cliente?.numero}` : '',
                        cliente?.bairro,
                        cliente?.cep ? `CEP: ${cliente?.cep}` : '',
                      ]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* OS details */}
              <div className="border border-gray-300">
                <div className="bg-gray-100 px-3 py-1.5 font-mono text-[10px] text-emerald-800 font-bold tracking-wider border-b border-gray-300 uppercase">
                  DETALHES DO SERVIÇO
                </div>
                <div className="p-3 space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-gray-600 uppercase block mb-1">MOTIVO DO CHAMADO / PROBLEMA RECLAMADO:</span>
                    <p className="bg-gray-50 border border-gray-200 p-2.5 text-gray-800 uppercase whitespace-pre-wrap rounded-xs">{os.motivo || 'NÃO ESPECIFICADO'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-gray-600 uppercase block mb-1">SERVIÇO OU REPARO SOLICITADO:</span>
                    <p className="bg-gray-50 border border-gray-200 p-2.5 text-gray-800 uppercase whitespace-pre-wrap rounded-xs">{os.servico || 'NÃO ESPECIFICADO'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold text-gray-600 uppercase">TÉCNICO RESPONSÁVEL:</span>{' '}
                      <span className="text-gray-900 font-bold uppercase ml-1">{os.responsavel || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="border border-gray-300">
                <div className="bg-gray-100 px-3 py-1.5 font-mono text-[10px] text-emerald-800 font-bold tracking-wider border-b border-gray-300 uppercase">
                  PEÇAS, COMPONENTES E MÃO DE OBRA
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-800">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-300 font-mono text-[10px] text-gray-600">
                        <th className="p-2 w-12 text-center">QTD</th>
                        <th className="p-2">DESCRIÇÃO</th>
                        <th className="p-2 text-right w-24">VALOR UNIT.</th>
                        <th className="p-2 text-right w-24">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 font-mono">
                      {os.produtos && os.produtos.length > 0 ? (
                        os.produtos.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-2 text-center text-emerald-700 font-bold">{item.qtd}</td>
                            <td className="p-2 uppercase text-gray-900 font-sans">{item.descricao}</td>
                            <td className="p-2 text-right text-gray-600">{formatBRL(item.valor)}</td>
                            <td className="p-2 text-right text-gray-900 font-bold">{formatBRL(item.qtd * item.valor)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-gray-500 italic uppercase font-sans">
                            Nenhuma peça ou componente listado nesta OS.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial summary */}
              <div className="flex justify-end">
                <div className="w-64 border border-gray-300 font-mono text-xs">
                  <div className="p-2 flex justify-between border-b border-gray-200 text-gray-600">
                    <span>SUBTOTAL PEÇAS/SERV:</span>
                    <span>{formatBRL((os.produtos || []).reduce((acc, i) => acc + i.qtd * i.valor, 0))}</span>
                  </div>
                  <div className="p-2 flex justify-between border-b border-gray-200 text-red-600">
                    <span>DESCONTO APLICADO:</span>
                    <span>-{formatBRL(os.desconto || 0)}</span>
                  </div>
                  <div className="p-2 flex justify-between bg-emerald-50 text-emerald-800 font-bold text-sm border-t border-emerald-200">
                    <span>TOTAL LÍQUIDO:</span>
                    <span>{formatBRL(os.valorTotal || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Observations */}
              {os.observacoes && (
                <div className="border border-gray-300 bg-gray-50 p-3">
                  <span className="font-mono text-[9px] text-emerald-800 font-bold block mb-1 uppercase tracking-widest">// OBSERVAÇÕES INTERNAS:</span>
                  <p className="text-gray-700 uppercase whitespace-pre-wrap">{os.observacoes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-hud-border flex flex-col sm:flex-row justify-between items-center gap-3 bg-hud-bg/30">
            <div className="text-[10px] font-mono text-hud-muted tracking-wider text-center sm:text-left">
              💡 <span className="text-hud-accent font-bold">DICA:</span> SE A IMPRESSÃO NÃO ABRIR, CLIQUE EM <span className="text-hud-text font-bold uppercase">"ABRIR EM NOVA ABA"</span> NO TOPO DO PAINEL DO SISTEMA.
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="hud-button-outline py-2 px-4 text-xs"
              >
                FECHAR PREVIA
              </button>
              <button
                onClick={handlePrint}
                className="hud-button-primary py-2 px-5 text-xs"
              >
                <Printer size={14} />
                IMPRIMIR / PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Render the actual printable document directly in the body via React Portal */}
      {createPortal(printLayout, document.body)}
    </>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import type { BancoLocal } from "./modelo";
import { criarBancoDemonstracao } from "./seed";

// Persistência provisória no navegador (apenas dados fictícios).
// Toda escrita passa por `alterar`, que é o ponto a ser trocado por chamadas
// ao servidor (Server Actions + PostgreSQL) quando o banco existir.

const CHAVE = "pront-ilpi:v1";

let cache: BancoLocal | null = null;
const ouvintes = new Set<() => void>();

function carregar(): BancoLocal {
  try {
    const salvo = window.localStorage.getItem(CHAVE);
    if (salvo) {
      const banco = JSON.parse(salvo) as BancoLocal;
      if (banco.versao === 1) return banco;
    }
  } catch {
    // armazenamento indisponível ou corrompido: recomeça com a demonstração
  }
  return criarBancoDemonstracao();
}

function salvar(banco: BancoLocal) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(banco));
  } catch {
    // sem armazenamento (aba privada): segue só em memória
  }
}

export function obterBanco(): BancoLocal {
  if (!cache) cache = carregar();
  return cache;
}

function avisar() {
  for (const ouvinte of ouvintes) ouvinte();
}

export function alterar(mutacao: (banco: BancoLocal) => BancoLocal) {
  cache = mutacao(obterBanco());
  salvar(cache);
  avisar();
}

export function reiniciarDemonstracao() {
  cache = criarBancoDemonstracao();
  salvar(cache);
  avisar();
}

function inscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  const aoMudarOutraAba = (e: StorageEvent) => {
    if (e.key === CHAVE) {
      cache = null;
      ouvinte();
    }
  };
  window.addEventListener("storage", aoMudarOutraAba);
  return () => {
    ouvintes.delete(ouvinte);
    window.removeEventListener("storage", aoMudarOutraAba);
  };
}

/** Banco no cliente; `null` durante a renderização no servidor. */
export function useBanco(): BancoLocal | null {
  return useSyncExternalStore(inscrever, obterBanco, () => null);
}

export function novoId(prefixo: string): string {
  return `${prefixo}_${crypto.randomUUID().slice(0, 8)}`;
}

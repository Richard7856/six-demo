"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SEED } from "./seed";
import type { BrandKit, Product, Proposal, StudioState, Zone } from "./types";

const STORAGE_KEY = "demo-six:v4";

type StudioContextValue = {
  state: StudioState;
  ready: boolean;
  setBrand: (patch: Partial<BrandKit>) => void;
  updateZone: (id: string, patch: Partial<Zone>) => void;
  addZone: (zone: Zone) => void;
  removeZone: (id: string) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  addProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  addProposals: (proposals: Proposal[]) => void;
  updateProposal: (id: string, patch: Partial<Proposal>) => void;
  removeProposal: (id: string) => void;
  reset: () => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudioState>(SEED);
  // `ready` evita el parpadeo entre el render del servidor (SEED) y la
  // hidratación desde localStorage.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...SEED, ...JSON.parse(raw) });
    } catch {
      // Si el guardado está corrupto, arrancamos limpio con el seed.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Cuota llena: seguimos en memoria, no rompemos la sesión.
    }
  }, [state, ready]);

  const setBrand = useCallback((patch: Partial<BrandKit>) => {
    setState((s) => ({ ...s, brand: { ...s.brand, ...patch } }));
  }, []);

  const updateZone = useCallback((id: string, patch: Partial<Zone>) => {
    setState((s) => ({
      ...s,
      zones: s.zones.map((z) => (z.id === id ? { ...z, ...patch } : z)),
    }));
  }, []);

  const addZone = useCallback((zone: Zone) => {
    setState((s) => ({ ...s, zones: [...s.zones, zone] }));
  }, []);

  const removeZone = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      zones: s.zones.filter((z) => z.id !== id),
      proposals: s.proposals.filter((p) => p.zoneId !== id),
    }));
  }, []);

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setState((s) => ({
      ...s,
      products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const addProduct = useCallback((product: Product) => {
    setState((s) => ({ ...s, products: [...s.products, product] }));
  }, []);

  const removeProduct = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      products: s.products.filter((p) => p.id !== id),
      proposals: s.proposals.filter((p) => p.productId !== id),
    }));
  }, []);

  const addProposals = useCallback((proposals: Proposal[]) => {
    setState((s) => ({ ...s, proposals: [...proposals, ...s.proposals] }));
  }, []);

  const updateProposal = useCallback((id: string, patch: Partial<Proposal>) => {
    setState((s) => ({
      ...s,
      proposals: s.proposals.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const removeProposal = useCallback((id: string) => {
    setState((s) => ({ ...s, proposals: s.proposals.filter((p) => p.id !== id) }));
  }, []);

  const reset = useCallback(() => {
    setState(SEED);
  }, []);

  const value = useMemo(
    () => ({
      state,
      ready,
      setBrand,
      updateZone,
      addZone,
      removeZone,
      updateProduct,
      addProduct,
      removeProduct,
      addProposals,
      updateProposal,
      removeProposal,
      reset,
    }),
    [
      state,
      ready,
      setBrand,
      updateZone,
      addZone,
      removeZone,
      updateProduct,
      addProduct,
      removeProduct,
      addProposals,
      updateProposal,
      removeProposal,
      reset,
    ],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio debe usarse dentro de <StudioProvider>");
  return ctx;
}

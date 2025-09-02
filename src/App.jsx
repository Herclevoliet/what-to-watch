import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dice5, Plus, Trash2, RotateCcw, Copy, History, Check, Film } from "lucide-react";

// Utility: random integer [0, n)
const rnd = (n) => Math.floor(Math.random() * n);

// Default seed options
const defaultOptions = ["Movie Night", "TV Episode", "YouTube Video", "Anime Episode"]; 

export default function WhatToWatchPicker() {
  const [options, setOptions] = useState(() => {
    try {
      const saved = localStorage.getItem("wtw-options");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch {}
    return defaultOptions.map((t, i) => ({ id: `${Date.now()}-${i}`, text: t }));
  });

  const [input, setInput] = useState("");
  const [result, setResult] = useState(null); // string
  const [history, setHistory] = useState([]); // string[]
  const [noRepeats, setNoRepeats] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wtw-noRepeats") || "true"); } catch { return true; }
  });
  const [isPicking, setIsPicking] = useState(false);
  const [copied, setCopied] = useState(false);

  const remaining = useMemo(() => {
    if (!noRepeats) return options;
    const pickedSet = new Set(history);
    return options.filter(o => !pickedSet.has(o.text));
  }, [options, noRepeats, history]);

  useEffect(() => {
    localStorage.setItem("wtw-options", JSON.stringify(options));
  }, [options]);

  useEffect(() => {
    localStorage.setItem("wtw-noRepeats", JSON.stringify(noRepeats));
  }, [noRepeats]);

  // Add option
  const addOption = (text) => {
    const t = (text ?? input).trim();
    if (!t) return;
    if (options.some(o => o.text.toLowerCase() === t.toLowerCase())) {
      setInput("");
      return;
    }
    setOptions(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, text: t }]);
    setInput("");
  };

  // Remove option
  const removeOption = (id) => {
    setOptions(prev => prev.filter(o => o.id !== id));
  };

  const clearAll = () => {
    setOptions([]);
    setHistory([]);
    setResult(null);
  };

  const resetHistory = () => {
    setHistory([]);
    setResult(null);
  };

  const copyList = async () => {
    const text = options.map(o => `• ${o.text}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  // Pick with fun animation
  const pickRandom = async () => {
    if ((noRepeats ? remaining : options).length === 0) return;

    setIsPicking(true);
    setResult(null);

    // Spin animation timing
    const spinSteps = 14 + rnd(7); // 14-20 hops
    const pool = noRepeats ? remaining : options;
    let current = "";

    for (let i = 0; i < spinSteps; i++) {
      current = pool[rnd(pool.length)].text;
      setResult(current);
      // Ease-out delay
      const delay = 60 + i * 25; // ms
      // await timeout
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, delay));
    }

    // Finalize pick
    setHistory(h => (h.includes(current) ? h : [...h, current]));
    setIsPicking(false);
  };

  const canPick = (noRepeats ? remaining : options).length > 0 && !isPicking;

  // Enter key handler for input
  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addOption();
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 p-6 md:p-10">
        <div className="mx-auto max-w-3xl">
          <header className="mb-6 flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm grid place-items-center">
              <Film className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">What to Watch – Random Picker</h1>
              <p className="text-slate-600">Enter options (e.g., 4 choices) and let the app decide for you.</p>
            </div>
          </header>

          <Card className="mb-6 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Options</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add an option (press Enter)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                />
                <Button onClick={() => addOption()} className="shrink-0" variant="default">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence>
                  {options.map((o) => (
                    <motion.div
                      key={o.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3 shadow-sm">
                        <span className="truncate pr-3">{o.text}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => removeOption(o.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove</TooltipContent>
                        </Tooltip>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" onClick={copyList}>
                      {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />} Copy list
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy all options to clipboard</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={clearAll}>
                      <Trash2 className="h-4 w-4 mr-1" /> Clear all
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove all options</TooltipContent>
                </Tooltip>

                <div className="ml-auto flex items-center gap-2">
                  <Switch id="norepeats" checked={noRepeats} onCheckedChange={setNoRepeats} />
                  <label htmlFor="norepeats" className="text-sm text-slate-700">No repeats</label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pick a Choice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="min-h-[72px] grid place-items-center w-full">
                  <AnimatePresence mode="wait">
                    <motion.div key={result ?? "placeholder"}
                      initial={{ scale: 0.96, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.98, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      className="text-center"
                    >
                      {result ? (
                        <div className="text-2xl md:text-3xl font-semibold">{result}</div>
                      ) : (
                        <div className="text-slate-500">Ready when you are 🎬</div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button size="lg" onClick={pickRandom} disabled={!canPick}>
                    <Dice5 className="h-5 w-5 mr-2" /> {isPicking ? "Picking..." : "Pick Random"}
                  </Button>
                  <Button variant="outline" onClick={resetHistory} disabled={history.length === 0}>
                    <RotateCcw className="h-4 w-4 mr-2" /> Reset picks
                  </Button>
                </div>

                {noRepeats && (
                  <div className="text-xs text-slate-600">
                    Remaining: {remaining.length} / {options.length}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5" /> History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-slate-500">No picks yet.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {history.map((h, i) => (
                    <Badge key={`${h}-${i}`} variant="secondary" className="rounded-xl">
                      {i + 1}. {h}
                    </Badge>
                  ))}
                </div>
              )}

              <Separator className="my-4" />
              <p className="text-[12px] text-slate-500">Tip: Toggle <span className="font-medium">No repeats</span> to avoid picking the same item until you reset picks.</p>
            </CardContent>
          </Card>

          <footer className="mt-8 text-center text-xs text-slate-500">
            Built with ❤️ using React, Tailwind, shadcn/ui and Framer Motion.
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}

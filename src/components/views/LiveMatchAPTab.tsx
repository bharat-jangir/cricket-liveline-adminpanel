import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Play, Square, Trash2, ListEnd, Download, RefreshCw,
  AlertTriangle, Pause, Database, Bug, Terminal, Globe
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { LiveMatchService } from "../../services/live-match.service";

interface QueueItem {
  id: string;
  data: string;
  timestamp: number;
  retryCount: number;
}

const MAX_QUEUE_SIZE = 1000;
const MAX_RETRY_COUNT = 3;
const BATCH_SIZE = 5;
const BATCH_TIMEOUT_MS = 1000;

// Helper to parse a standard cURL command into an object usable by fetch()
function parseCurl(curlString: string) {
  if (!curlString) return null;

  // 1. Clean up Windows caret multi-line escapes and specific caret-quoted strings
  let cleanCurl = curlString
    .replace(/\^\r?\n/g, " ")  // Remove line-continuation carets
    .replace(/\^"/g, '"')      // Change ^" to just "
    .replace(/\^\\"/g, '"')    // Change ^\" to just "
    .replace(/\\"/g, '"');     // Clean up any remaining escaped internal quotes

  // 2. Extract URL - matching quotes or no quotes safely
  const urlMatch = cleanCurl.match(/curl\s+["']?([^"'\s>]+)["']?/i);
  if (!urlMatch) return null;
  let url = urlMatch[1];

  const headers: Record<string, string> = {};
  let method = "GET";
  let body: string | null = null;

  // 3. Extract Headers (-H or --header)
  // Accommodates headers wrapped in single or double quotes
  const headerRegex = /(?:-H|--header)\s+["']([^"']+)["']/g;
  let match;
  while ((match = headerRegex.exec(cleanCurl)) !== null) {
    const parts = match[1].split(":");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join(":").trim();

      // CRITICAL: Skip caching/validation headers that stop servers from sending fresh data
      if (key.toLowerCase() === "if-none-match" || key.toLowerCase() === "if-modified-since") {
        continue;
      }

      headers[key] = value;
    }
  }

  // 4. Extract Method (-X)
  const methodMatch = cleanCurl.match(/(?:-X|--request)\s+(\S+)/);
  if (methodMatch) method = methodMatch[1].replace(/["']/g, "").toUpperCase();

  // 5. Extract Data/Body (--data, -d, --data-raw)
  const bodyMatch = cleanCurl.match(/(?:-d|--data|--data-raw|--data-binary)\s+["']([\s\S]*?)["'](?=\s+-(?:H|X|d|\w)|$)/);
  if (bodyMatch) {
    body = bodyMatch[1];
    if (method === "GET") method = "POST";
  }

  return { url, method, headers, body };
}

// Inside your component file
function buildBootstrapPage(targetUrl: string, apiFilter: string): string {
  const escapedTargetUrl = targetUrl.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const escapedApiFilter = apiFilter.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><script>
(function() {
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  let hasNavigated = false;
  
  function sendToParent(data, url) {
    try { window.parent.postMessage({ type: '__INTERCEPTED__', data: data, url: url, timestamp: Date.now() }, '*'); } catch(e) {}
  }
  
  window.fetch = function() {
    const args = Array.prototype.slice.call(arguments);
    const request = args[0];
    let reqUrl = typeof request === 'string' ? request : (request instanceof Request ? request.url : String(request));
    return originalFetch.apply(this, args).then(async function(response) {
      const filter = "${escapedApiFilter}";
      if (!filter || reqUrl.includes(filter)) {
        try {
          const clonedResponse = response.clone();
          const data = await clonedResponse.json();
          sendToParent(data, reqUrl);
        } catch(e) {}
      }
      return response;
    });
  };
  
  XMLHttpRequest.prototype.open = function(method, url) {
    this._interceptUrl = url;
    return originalXHROpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function() {
    this.addEventListener('load', function() {
      const filter = "${escapedApiFilter}";
      if (!filter || (this._interceptUrl && this._interceptUrl.includes(filter))) {
        try {
          let data;
          if (this.responseType === 'json') {
            data = this.response;
          } else if (this.responseType === '' || this.responseType === 'text') {
            if (this.responseText && this.responseText.trim().length > 0) {
              data = JSON.parse(this.responseText);
            }
          }
          if (data) {
            sendToParent(data, this._interceptUrl);
          }
        } catch(e) {}
      }
    });
    return originalXHRSend.apply(this, arguments);
  };
  
  setTimeout(function() { if (!hasNavigated) { hasNavigated = true; window.location.href = "${escapedTargetUrl}"; } }, 100);
})();
</script></head><body style="background:#f0f0f0;text-align:center;padding-top:20px;font-family:sans-serif;color:#666;"><p>Loading match...</p></body></html>`;
}

export function LiveMatchAPTab() {
  const { id } = useParams();

  // Mode Selection: 'iframe' or 'curl'
  const [mode, setMode] = useState<"iframe" | "curl">(() => {
    return (localStorage.getItem("ap_mode") as "iframe" | "curl") || "iframe";
  });

  // Persistent Input States
  const [url, setUrl] = useState(() => localStorage.getItem("ap_url") || "");
  const [selector, setSelector] = useState(() => localStorage.getItem("ap_selector") || "");
  const [apiFilter, setApiFilter] = useState(() => localStorage.getItem("ap_filter") || "/api/v3/getSV3");
  const [rawCurl, setRawCurl] = useState(() => localStorage.getItem("ap_raw_curl") || "");
  const [fetchInterval, setFetchInterval] = useState(() => Number(localStorage.getItem("ap_fetch_interval")) || 1000);

  // Core Functional States
  const [isInterceptorActive, setIsInterceptorActive] = useState(() => localStorage.getItem("ap_is_active") === "true");
  const [isAutoDequeue, setIsAutoDequeue] = useState(() => localStorage.getItem("ap_is_auto_dequeue") === "true");

  // Persistent Data States (Survives Refresh)
  const [queue, setQueue] = useState<QueueItem[]>(() => {
    const saved = localStorage.getItem(`ap_queue_${id || "global"}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [failedItems, setFailedItems] = useState<QueueItem[]>(() => {
    const saved = localStorage.getItem(`ap_failed_${id || "global"}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem(`ap_stats_${id || "global"}`);
    return saved ? JSON.parse(saved) : { totalIntercepted: 0, totalProcessed: 0, totalFailed: 0 };
  });
  const [lastExtracted, setLastExtracted] = useState<string | null>(() => localStorage.getItem(`ap_last_extracted_${id || "global"}`));
  const [lastFullResponse, setLastFullResponse] = useState<any>(() => {
    const saved = localStorage.getItem(`ap_last_resp_${id || "global"}`);
    return saved ? JSON.parse(saved) : null;
  });

  const [interceptorStatus, setInterceptorStatus] = useState("Not started");
  const [iframeKey, setIframeKey] = useState(0);

  // Refs for loop controls
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isProcessingRef = useRef(false);
  const pendingBatchIdsRef = useRef<Set<string>>(new Set());
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const curlIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const queueRef = useRef<QueueItem[]>(queue);
  const selectorRef = useRef(selector);
  const isInterceptorActiveRef = useRef(isInterceptorActive);
  const bootstrappedRef = useRef(false);
  const lastExtractedRef = useRef<string | null>(lastExtracted);

  // Synchronize dynamic values to refs to avoid effect tearing
  useEffect(() => { selectorRef.current = selector; }, [selector]);
  useEffect(() => { isInterceptorActiveRef.current = isInterceptorActive; }, [isInterceptorActive]);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { lastExtractedRef.current = lastExtracted; }, [lastExtracted]);

  // Sync state maps to LocalStorage whenever they change
  useEffect(() => { localStorage.setItem("ap_mode", mode); }, [mode]);
  useEffect(() => { localStorage.setItem("ap_url", url); }, [url]);
  useEffect(() => { localStorage.setItem("ap_selector", selector); }, [selector]);
  useEffect(() => { localStorage.setItem("ap_filter", apiFilter); }, [apiFilter]);
  useEffect(() => { localStorage.setItem("ap_raw_curl", rawCurl); }, [rawCurl]);
  useEffect(() => { localStorage.setItem("ap_fetch_interval", String(fetchInterval)); }, [fetchInterval]);
  useEffect(() => { localStorage.setItem("ap_is_auto_dequeue", String(isAutoDequeue)); }, [isAutoDequeue]);
  useEffect(() => { localStorage.setItem("ap_is_active", String(isInterceptorActive)); }, [isInterceptorActive]);

  // Auto-start interceptor on mount if it was left active
  useEffect(() => {
    if (isInterceptorActiveRef.current) {
      if (mode === "curl") {
        executeCurlFetch();
        curlIntervalRef.current = setInterval(executeCurlFetch, fetchInterval);
      } else {
        setTimeout(() => { if (iframeRef.current) writeBootstrapPage(); }, 100);
      }
    }
  }, []); // Run only on mount

  useEffect(() => {
    const keyId = id || "global";
    localStorage.setItem(`ap_queue_${keyId}`, JSON.stringify(queue));
    localStorage.setItem(`ap_failed_${keyId}`, JSON.stringify(failedItems));
    localStorage.setItem(`ap_stats_${keyId}`, JSON.stringify(stats));
    if (lastExtracted) localStorage.setItem(`ap_last_extracted_${keyId}`, lastExtracted);
    if (lastFullResponse) localStorage.setItem(`ap_last_resp_${keyId}`, JSON.stringify(lastFullResponse));
  }, [queue, failedItems, stats, lastExtracted, lastFullResponse, id]);

  const extractValue = useCallback((data: any, path: string): any => {
    if (!path || !data) return data;
    try {
      const parts = path.split(".");
      let current = data;
      for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        current = current[part];
      }
      return current;
    } catch {
      return undefined;
    }
  }, []);

  const handleInterceptedData = useCallback((data: any, responseUrl: string = "unknown") => {
    if (!isInterceptorActiveRef.current) return;

    setLastFullResponse(data);
    const currentSelector = selectorRef.current;
    let extracted = currentSelector ? extractValue(data, currentSelector) : data;

    if (extracted !== undefined && extracted !== null) {
      const valString = typeof extracted === "object" ? JSON.stringify(extracted) : String(extracted);

      setQueue((prev) => {
        // Prevent adding if it's the exact same as the last extracted value
        if (lastExtractedRef.current === valString) return prev;

        setStats((s: any) => ({ ...s, totalIntercepted: s.totalIntercepted + 1 }));
        setLastExtracted(valString);

        const newItem: QueueItem = {
          id: `${Date.now()}-${Math.random()}`,
          data: valString,
          timestamp: Date.now(),
          retryCount: 0
        };

        const updated = [...prev, newItem];
        if (updated.length > MAX_QUEUE_SIZE) updated.shift();
        toast.success(`✅ Captured: ${valString.substring(0, 40)}...`);
        return updated;
      });
    }
  }, [extractValue]);

  // cURL Execution Logic Loop
  const executeCurlFetch = useCallback(async () => {
    const parsed = parseCurl(rawCurl);
    if (!parsed) {
      setInterceptorStatus("Error: Invalid cURL Command Syntax");
      stopInterceptor();
      return;
    }

    setInterceptorStatus("Active ✓ - Fetching data stream...");
    try {
      const options: RequestInit = {
        method: parsed.method,
        headers: parsed.headers,
        mode: 'cors' // Ensure CORS tracking is friendly
      };
      if (parsed.body) options.body = parsed.body;

      const res = await fetch(parsed.url, options);

      // Read response text first to verify if it's actually valid JSON
      const responseText = await res.text();

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${responseText.substring(0, 50)}`);
      }

      // Try parsing safely
      try {
        const data = JSON.parse(responseText);
        handleInterceptedData(data, parsed.url);
      } catch (parseErr) {
        // It wasn't JSON! Show a snippet of what the server returned instead
        throw new Error(`Server returned HTML/Text instead of JSON: "${responseText.substring(0, 60)}..."`);
      }

    } catch (err: any) {
      console.error("CURL Fetch failure:", err);
      setInterceptorStatus(`Fetch Error: ${err.message || err}`);
    }
  }, [rawCurl, handleInterceptedData]);

  // Handle postMessage for standard iframe extraction
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "__INTERCEPTED__") {
        handleInterceptedData(event.data.data, event.data.url);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [handleInterceptedData]);

  const writeBootstrapPage = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return false;
    try {
      const doc = iframe.contentDocument;
      if (!doc) return false;
      doc.open();
      doc.write(buildBootstrapPage(url, apiFilter));
      doc.close();
      setInterceptorStatus("Bootstrap injected - navigating...");
      return true;
    } catch (e) {
      setInterceptorStatus(`Failed: ${e}`);
      return false;
    }
  }, [url, apiFilter]);

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !isInterceptorActiveRef.current) return;
    try {
      const currentUrl = iframe.contentWindow?.location.href || "";
      if (!bootstrappedRef.current && (currentUrl === "about:blank" || currentUrl === "")) {
        bootstrappedRef.current = true;
        writeBootstrapPage();
      } else if (bootstrappedRef.current && currentUrl !== "about:blank") {
        setInterceptorStatus("Active ✓ - Monitoring API calls");
        toast.success("Page loaded, interceptor active!");
      }
    } catch {
      setInterceptorStatus("Active ✓ - Framework active across scopes");
    }
  }, [writeBootstrapPage]);

  const startInterceptor = useCallback(() => {
    if (mode === "iframe") {
      if (!url) return toast.error("Please enter a target URL");
      bootstrappedRef.current = false;
      setInterceptorStatus("Starting...");
      setIframeKey(prev => prev + 1);
      setIsInterceptorActive(true);
      setTimeout(() => { if (iframeRef.current) writeBootstrapPage(); }, 100);
    } else {
      if (!rawCurl) return toast.error("Please paste a valid standard cURL command");
      const testParse = parseCurl(rawCurl);
      if (!testParse) return toast.error("Could not parse cURL string. Check syntax.");

      setIsInterceptorActive(true);
      executeCurlFetch(); // Fire immediately
      curlIntervalRef.current = setInterval(executeCurlFetch, fetchInterval);
    }
  }, [mode, url, rawCurl, fetchInterval, writeBootstrapPage, executeCurlFetch]);

  const stopInterceptor = useCallback(() => {
    setIsInterceptorActive(false);
    setInterceptorStatus("Stopped");
    bootstrappedRef.current = false;
    if (curlIntervalRef.current) {
      clearInterval(curlIntervalRef.current);
      curlIntervalRef.current = null;
    }
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => { if (curlIntervalRef.current) clearInterval(curlIntervalRef.current); };
  }, []);

  // Queue Automations
  const processQueueItem = useCallback(async (item: QueueItem): Promise<boolean> => {
    if (!id) return false;
    try {
      await LiveMatchService.handleSimpleEvent(id, item.data);
      setStats((prev: any) => ({ ...prev, totalProcessed: prev.totalProcessed + 1 }));
      return true;
    } catch (error) {
      if (item.retryCount < MAX_RETRY_COUNT) {
        setFailedItems((prev) => [...prev, { ...item, retryCount: item.retryCount + 1 }]);
      } else {
        setStats((prev: any) => ({ ...prev, totalFailed: prev.totalFailed + 1 }));
        toast.error(`Event delivery abandoned after max retries`);
      }
      return false;
    }
  }, [id]);

  const processBatch = useCallback(async (items: QueueItem[]) => {
    if (isProcessingRef.current || items.length === 0) return;
    isProcessingRef.current = true;

    const results = await Promise.allSettled(items.map((item) => processQueueItem(item)));
    const successIds = new Set(
      items.filter((_, i) => results[i].status === "fulfilled" && (results[i] as PromiseFulfilledResult<boolean>).value)
        .map((item) => item.id)
    );

    setQueue((prev) => prev.filter((item) => !successIds.has(item.id)));
    items.forEach((item) => pendingBatchIdsRef.current.delete(item.id));
    isProcessingRef.current = false;
  }, [processQueueItem]);

  useEffect(() => {
    if (!isAutoDequeue || queue.length === 0) return;

    const newItems = queue.filter((item) => !pendingBatchIdsRef.current.has(item.id));
    if (newItems.length === 0) return;

    const batch = newItems.slice(0, BATCH_SIZE);
    batch.forEach((item) => pendingBatchIdsRef.current.add(item.id));

    if (batchTimeoutRef.current) clearTimeout(batchTimeoutRef.current);
    batchTimeoutRef.current = setTimeout(() => processBatch(batch), BATCH_TIMEOUT_MS);
  }, [isAutoDequeue, queue, processBatch]);

  const dequeueOne = useCallback(async () => {
    const [first, ...rest] = queueRef.current;
    if (!first) return;
    if (await processQueueItem(first)) {
      setQueue(rest);
      toast.success("Dispatched event manually");
    }
  }, [processQueueItem]);

  const retryFailedItems = useCallback(async () => {
    const items = [...failedItems];
    setFailedItems([]);
    for (const item of items) {
      await processQueueItem(item);
      await new Promise((r) => setTimeout(r, 400));
    }
  }, [failedItems, processQueueItem]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setFailedItems([]);
    pendingBatchIdsRef.current.clear();
    setStats({ totalIntercepted: 0, totalProcessed: 0, totalFailed: 0 });
    setLastExtracted(null);
    setLastFullResponse(null);
    const keyId = id || "global";
    localStorage.removeItem(`ap_last_extracted_${keyId}`);
    localStorage.removeItem(`ap_last_resp_${keyId}`);
    toast.success("Registers and history dropped");
  }, [id]);

  const exportCsv = useCallback(() => {
    const rows = [["Timestamp", "Data"], ...queue.map((item) => [new Date(item.timestamp).toLocaleString(), `"${item.data.replace(/"/g, '""')}"`])];
    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stream_capture_${Date.now()}.csv`;
    link.click();
  }, [queue]);

  const testCurrentSelector = useCallback(() => {
    if (!lastFullResponse) return toast.error("No raw payload logged yet.");
    const result = extractValue(lastFullResponse, selector);
    toast.info(`"${selector || "root"}" → ${result !== undefined ? JSON.stringify(result).substring(0, 80) : "NOT FOUND"}`);
  }, [lastFullResponse, selector, extractValue]);

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full p-4 overflow-hidden">
      <div className="flex-[2] flex flex-col gap-4 overflow-hidden">
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Ingestion Stream Setup
            </CardTitle>

            {/* Mode Switching Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border">
              <Button
                variant={mode === "iframe" ? "default" : "ghost"}
                size="sm" className="h-7 text-xs px-3"
                onClick={() => { stopInterceptor(); setMode("iframe"); }}
              >
                <Globe size={13} className="mr-1" /> iFrame Agent
              </Button>
              <Button
                variant={mode === "curl" ? "default" : "ghost"}
                size="sm" className="h-7 text-xs px-3"
                onClick={() => { stopInterceptor(); setMode("curl"); }}
              >
                <Terminal size={13} className="mr-1" /> Direct cURL Fetch
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <div className={`text-xs p-2 rounded border font-semibold ${interceptorStatus.includes("Active") ? "bg-green-50 border-green-200 text-green-700" :
              interceptorStatus.includes("Error") || interceptorStatus.includes("Failed") ? "bg-red-50 border-red-200 text-red-700" :
                "bg-blue-50 border-blue-200 text-blue-700"
              }`}>
              🔍 Runtime Status: {interceptorStatus}
            </div>

            {mode === "iframe" ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Target UI Document Address</Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://crex.com/cricket-live-score/..."
                    disabled={isInterceptorActive}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">XHR API Filter Identifier</Label>
                  <Input
                    value={apiFilter}
                    onChange={(e) => setApiFilter(e.target.value)}
                    placeholder="/api/v3/getSV3"
                    className="font-mono text-xs"
                    disabled={isInterceptorActive}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Paste Network cURL Request Command</Label>
                  <textarea
                    value={rawCurl}
                    onChange={(e) => setRawCurl(e.target.value)}
                    placeholder="Paste curl command from browser Devtools network options..."
                    className="w-full h-24 font-mono text-xs p-2 rounded border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isInterceptorActive}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Polled Loop Refresh Interval (ms)</Label>
                  <Input
                    type="number"
                    value={fetchInterval}
                    onChange={(e) => setFetchInterval(Number(e.target.value))}
                    placeholder="1000"
                    disabled={isInterceptorActive}
                    className="w-32 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs flex justify-between items-center">
                <span>Data Value Selector Engine Path</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={testCurrentSelector}>
                  <Bug size={12} className="mr-1" />Evaluate Node
                </Button>
              </Label>
              <Input
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                placeholder="ats, B, s, j, k or blank for target envelope payload"
                className="font-mono text-xs"
              />
              <div className="text-xs text-slate-500 space-y-1">
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: "Full Object", value: "" },
                    { label: "ats (Score)", value: "ats" },
                    { label: "B (Balls Left)", value: "B" },
                    { label: "s (RR)", value: "s" },
                    { label: "j (T1)", value: "j" },
                    { label: "k (T2)", value: "k" },
                  ].map(({ label, value }) => (
                    <code
                      key={label}
                      className="bg-slate-100 px-1 rounded cursor-pointer hover:bg-blue-100 text-xs text-[11px]"
                      onClick={() => setSelector(value)}
                    >
                      {label}
                    </code>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant={isInterceptorActive ? "destructive" : "default"}
              className="w-full"
              onClick={isInterceptorActive ? stopInterceptor : startInterceptor}
            >
              {isInterceptorActive ? <><Square size={14} className="mr-2" />Terminate Pipeline</> : <><Play size={14} className="mr-2" />Fire Up Pipeline</>}
            </Button>

            <div className="grid grid-cols-3 gap-2 text-center text-xs p-2 bg-slate-50 rounded">
              <div><div className="text-slate-500">Collected</div><div className="font-bold text-lg text-blue-600">{stats.totalIntercepted}</div></div>
              <div><div className="text-slate-500">Pushed</div><div className="font-bold text-lg text-green-600">{stats.totalProcessed}</div></div>
              <div><div className="text-slate-500">Dropped</div><div className="font-bold text-lg text-red-600">{stats.totalFailed}</div></div>
            </div>
          </CardContent>
        </Card>

        {/* Hidden preview structure if in cURL mode */}
        <Card className={`flex-1 flex flex-col overflow-hidden ${mode === "curl" ? "opacity-40 pointer-events-none" : ""}`}>
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm">Sandbox IFrame Environment Preview {mode === "curl" && "(Inactive)"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {mode === "iframe" && (
              <iframe
                key={iframeKey}
                ref={iframeRef}
                src="about:blank"
                onLoad={handleIframeLoad}
                className="w-full h-full min-h-[320px] border-0"
                title="Context Target Sync"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 min-w-[300px] flex flex-col gap-4 overflow-hidden">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="py-3 px-4 flex-row justify-between items-center">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database size={14} />
              Broker Queue ({queue.length})
              {failedItems.length > 0 && <span className="text-xs text-red-500 font-bold">({failedItems.length} bad)</span>}
            </CardTitle>
            <div className="flex gap-1">
              {failedItems.length > 0 && (
                <Button size="sm" variant="outline" onClick={retryFailedItems} className="h-7 text-xs">
                  <RefreshCw size={12} className="mr-1" />Flushed Err
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={exportCsv} className="h-7 text-xs">
                <Download size={12} className="mr-1" />CSV
              </Button>
              <Button size="sm" variant="outline" onClick={clearQueue} className="h-7 text-xs">
                <Trash2 size={12} />
              </Button>
            </div>
          </CardHeader>

          {lastFullResponse && (
            <div className="p-2 border-b bg-green-50">
              <div className="text-[11px] font-semibold text-green-700 mb-1">✓ Last Valid Parsed Envelope Matrix:</div>
              <div className="text-[11px] font-mono bg-white p-2 rounded max-h-20 overflow-auto break-all">
                {Object.keys(lastFullResponse).slice(0, 15).join(", ")}
              </div>
              <div className="text-[11px] mt-1 text-slate-600 grid grid-cols-2 gap-1 font-mono">
                <div>Score: {lastFullResponse.ats ?? "N/A"}</div>
                <div>RR: {lastFullResponse.s ?? "N/A"}</div>
                <div>T1: {lastFullResponse.j ?? "N/A"}</div>
                <div>T2: {lastFullResponse.k ?? "N/A"}</div>
              </div>
            </div>
          )}

          <div className="p-2 border-b bg-slate-50">
            <div className="text-xs font-semibold mb-1">Extracted Out:</div>
            <div className="text-xs font-mono bg-white p-2 rounded max-h-16 overflow-auto break-all text-blue-600">
              {lastExtracted ?? "Awaiting Data Loop Execution..."}
            </div>
          </div>

          <CardContent className="p-0 flex-1 overflow-auto">
            {queue.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-10">
                {isInterceptorActive ? "⏳ Monitoring data stream loops..." : "▶️ Trigger execution mode to poll data arrays"}
              </div>
            ) : (
              queue.map((item, idx) => (
                <div key={item.id} className="text-xs font-mono p-2 border-b hover:bg-slate-50">
                  <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
                    <span>Item Row #{idx + 1}</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="break-all line-clamp-2 text-slate-700">{item.data}</div>
                </div>
              ))
            )}
          </CardContent>

          <div className="p-3 border-t flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={queue.length === 0 || isProcessingRef.current}
              onClick={dequeueOne}
            >
              <ListEnd size={14} className="mr-2" />Dispatch Single
            </Button>
            <Button
              variant={isAutoDequeue ? "destructive" : "default"}
              size="sm"
              className="flex-1"
              onClick={() => setIsAutoDequeue((v) => !v)}
            >
              {isAutoDequeue ? <><Pause size={14} className="mr-2" />Pause Dispatcher</> : <><Play size={14} className="mr-2" />Automate Batch</>}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { SAMPLE_TRACE, fetchTraceFromRpc } from "@/lib/analyzer-utils"

interface TraceInputProps {
  traceJson: string
  onTraceJsonChange: (json: string) => void
}

export function TraceInput({ traceJson, onTraceJsonChange }: TraceInputProps) {
  const [txHash, setTxHash] = useState("")
  const [rpcUrl, setRpcUrl] = useState("https://eth.llamarpc.com")
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  async function handleFetchTrace() {
    if (!txHash.trim() || !rpcUrl.trim()) return
    setIsFetching(true)
    setFetchError(null)
    try {
      const trace = await fetchTraceFromRpc(rpcUrl, txHash)
      onTraceJsonChange(trace)
    } catch (e) {
      setFetchError((e as Error).message)
    } finally {
      setIsFetching(false)
    }
  }

  return (
    <Tabs defaultValue="paste">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="paste">Paste JSON</TabsTrigger>
        <TabsTrigger value="rpc">Fetch from RPC</TabsTrigger>
      </TabsList>

      <TabsContent value="paste" className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-amber-900">Trace JSON</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onTraceJsonChange(SAMPLE_TRACE)}
            >
              Load Sample
            </Button>
            {traceJson && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => onTraceJsonChange("")}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        <textarea
          className="flex min-h-[200px] w-full rounded-md border border-amber-200 bg-white px-3 py-2 font-mono text-sm text-amber-900 placeholder:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
          rows={12}
          placeholder='Paste your debug_traceTransaction JSON result here...'
          value={traceJson}
          onChange={(e) => onTraceJsonChange(e.target.value)}
        />
        {traceJson && (
          <p className="text-xs text-amber-600">
            {traceJson.length.toLocaleString()} characters
            {traceJson.length > 10_000_000 && (
              <span className="ml-2 font-medium text-amber-800">
                Large trace - analysis may take several seconds
              </span>
            )}
          </p>
        )}
      </TabsContent>

      <TabsContent value="rpc" className="space-y-4">
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-800 text-xs">
            The RPC endpoint must support <code className="font-mono">debug_traceTransaction</code> with{" "}
            <code className="font-mono">enableMemory: true</code> and allow CORS from this origin.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label className="text-amber-900">Transaction Hash</Label>
          <Input
            placeholder="0x..."
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            className="font-mono border-amber-200"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-amber-900">RPC URL</Label>
          <Input
            placeholder="https://..."
            value={rpcUrl}
            onChange={(e) => setRpcUrl(e.target.value)}
            className="font-mono border-amber-200"
          />
        </div>

        <Button
          onClick={handleFetchTrace}
          disabled={isFetching || !txHash.trim() || !rpcUrl.trim()}
          className="bg-green-700 text-amber-50 hover:bg-green-600"
        >
          {isFetching ? (
            <>
              <Spinner className="mr-2" />
              Fetching...
            </>
          ) : (
            "Fetch Trace"
          )}
        </Button>

        {fetchError && (
          <Alert variant="destructive">
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        )}

        {traceJson && (
          <p className="text-xs text-green-700">
            Trace loaded ({traceJson.length.toLocaleString()} characters)
          </p>
        )}
      </TabsContent>
    </Tabs>
  )
}

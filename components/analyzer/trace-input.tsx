"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { fetchTraceFromRpc } from "@/lib/analyzer-utils"
import { NETWORKS } from "@/lib/networks"

interface TraceInputProps {
  traceJson: string
  onTraceJsonChange: (json: string) => void
}

export function TraceInput({ traceJson, onTraceJsonChange }: TraceInputProps) {
  const [txHash, setTxHash] = useState("")
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]?.id ?? "")
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const network = NETWORKS.find((n) => n.id === selectedNetwork)

  async function handleFetchTrace() {
    if (!txHash.trim() || !network?.rpcUrl) return
    setIsFetching(true)
    setFetchError(null)
    try {
      const trace = await fetchTraceFromRpc(network.rpcUrl, txHash)
      onTraceJsonChange(trace)
    } catch (e) {
      setFetchError((e as Error).message)
    } finally {
      setIsFetching(false)
    }
  }

  return (
    <div className="space-y-4">
      {NETWORKS.length === 0 ? (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-800 text-sm">
            No RPC endpoints configured. Set <code className="font-mono">NEXT_PUBLIC_RPC_ETHEREUM</code>,{" "}
            <code className="font-mono">NEXT_PUBLIC_RPC_GNOSIS</code>, or{" "}
            <code className="font-mono">NEXT_PUBLIC_RPC_SEPOLIA</code> environment variables.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="space-y-2">
            <Label className="text-amber-900">Network</Label>
            <div className="flex gap-2">
              {NETWORKS.map((n) => (
                <Button
                  key={n.id}
                  variant={selectedNetwork === n.id ? "default" : "outline"}
                  size="sm"
                  className={
                    selectedNetwork === n.id
                      ? "bg-green-700 text-amber-50 hover:bg-green-600"
                      : "border-amber-200 text-amber-800 hover:bg-amber-100"
                  }
                  onClick={() => setSelectedNetwork(n.id)}
                >
                  {n.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-amber-900">Transaction Hash</Label>
            <Input
              placeholder="0x..."
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="font-mono border-amber-200"
            />
          </div>

          <Button
            onClick={handleFetchTrace}
            disabled={isFetching || !txHash.trim() || !network?.rpcUrl}
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
        </>
      )}

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
    </div>
  )
}

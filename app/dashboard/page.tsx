"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

export default function Page() {
  const { status } = useSession()
  const router = useRouter()
  const [caseData, setCaseData] = useState<[]>([]) // Ensure caseData is an array
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    async function fetchCases() {
      try {
        const response = await fetch("/api/cases")
        if (!response.ok) {
          throw new Error(`Failed to fetch cases: ${response.statusText}`)
        }
        const data = await response.json()
        if (Array.isArray(data)) {
          setCaseData(data)
        } else {
          throw new Error("Invalid data format")
        }
      } catch (error) {
        console.error("Failed to fetch case data:", error)
        setError("Failed to load case data. Please try again later.")
      }
    }
    fetchCases()
  }, [])

  if (status === "loading") {
    return null
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          {error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : (
            <DataTable data={caseData} />
          )}
        </div>
      </div>
    </div>
  )
}

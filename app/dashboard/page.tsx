"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

interface Crime {
  id: number;
  caseId: string;
  title: string;
  crimeType: string;
  status: string;
  time: string;
  location: string;
  assignedOfficer: string;
  description: string;
  role: string;
}

export default function Page() {
  const { status, data: session } = useSession()
  const router = useRouter()
  const [crimes, setCrimes] = useState<Crime[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    async function fetchCrimes() {
      try {
        const response = await fetch("/api/crimes")
        if (!response.ok) {
          throw new Error(`Failed to fetch crimes: ${response.statusText}`)
        }
        console.log("showing crimes")
        console.log(response)
        const data = await response.json()
        if (Array.isArray(data)) {
          setCrimes(data)
        } else {
          throw new Error("Invalid data format")
        }
      } catch (error) {
        console.error("Failed to fetch crime data:", error)
        setError("Failed to load crime data. Please try again later.")
      }
    }
    fetchCrimes()
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
            <DataTable data={crimes} />
          )}
        </div>
      </div>
    </div>
  )
}

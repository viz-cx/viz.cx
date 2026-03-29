"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { deleteCookie } from "@/lib/auth"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    deleteCookie("login")
    deleteCookie("regular")
    deleteCookie("avatar")
    router.push("/")
  }, [router])

  return <div className="text-center py-8 text-gray-500">Logging out...</div>
}

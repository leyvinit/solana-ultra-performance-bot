'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface Trade {
  id: number
  type: 'win' | 'loss'
  amount: number
  timestamp: string
}

export default function TradeDashboard() {
  const [priorityFee, setPriorityFee] = useState<number>(5000)
  const [trades, setTrades] = useState<Trade[]>([])

  useEffect(() => {
    // Simulating fetching trade data
    const fetchTrades = async () => {
      // In a real application, this would be an API call
      const mockTrades: Trade[] = [
        { id: 1, type: 'win', amount: 0.5, timestamp: '2023-05-01T10:00:00Z' },
        { id: 2, type: 'loss', amount: 0.3, timestamp: '2023-05-02T11:30:00Z' },
        { id: 3, type: 'win', amount: 0.7, timestamp: '2023-05-03T09:15:00Z' },
        { id: 4, type: 'win', amount: 0.4, timestamp: '2023-05-04T14:45:00Z' },
        { id: 5, type: 'loss', amount: 0.6, timestamp: '2023-05-05T16:20:00Z' },
      ]
      setTrades(mockTrades)
    }

    fetchTrades()
  }, [])

  const handlePriorityFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPriorityFee(Number(e.target.value))
  }

  const handleUpdatePriorityFee = async () => {
    // In a real application, this would be an API call to update the priority fee
    console.log(`Updating priority fee to ${priorityFee} lamports`)
    // You would typically update this in your bot's configuration
  }

  const totalWins = trades.filter(trade => trade.type === 'win').reduce((sum, trade) => sum + trade.amount, 0)
  const totalLosses = trades.filter(trade => trade.type === 'loss').reduce((sum, trade) => sum + trade.amount, 0)

  const chartData = [
    { name: 'Wins', amount: totalWins },
    { name: 'Losses', amount: totalLosses },
  ]

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Trade Dashboard</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Adjust Priority Fee</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={priorityFee}
              onChange={handlePriorityFeeChange}
              placeholder="Priority Fee (lamports)"
              className="max-w-xs"
            />
            <Button onClick={handleUpdatePriorityFee}>Update Fee</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trade Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Total Wins: {totalWins.toFixed(2)} SOL</p>
            <p>Total Losses: {totalLosses.toFixed(2)} SOL</p>
            <p>Net Profit: {(totalWins - totalLosses).toFixed(2)} SOL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trade Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart width={300} height={200} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            {trades.map(trade => (
              <li key={trade.id} className={`mb-2 ${trade.type === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                {trade.type === 'win' ? 'Win' : 'Loss'}: {trade.amount} SOL - {new Date(trade.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}


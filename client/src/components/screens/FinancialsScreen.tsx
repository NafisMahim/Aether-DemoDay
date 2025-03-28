import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

interface FinancialsScreenProps {
  handleBack: () => void
}

interface Financial {
  id: number
  category: string
  amount: number
  type: "income" | "expense"
}

export default function FinancialsScreen({ handleBack }: FinancialsScreenProps) {
  const { toast } = useToast()
  const [financials, setFinancials] = useState<Financial[]>([
    { id: 1, category: "Salary", amount: 5000, type: "income" },
    { id: 2, category: "Rent", amount: 1500, type: "expense" },
    { id: 3, category: "Groceries", amount: 400, type: "expense" },
    { id: 4, category: "Utilities", amount: 200, type: "expense" },
    { id: 5, category: "Investments", amount: 800, type: "income" }
  ])
  const [activeTab, setActiveTab] = useState<"overview" | "income" | "expenses">("overview")
  
  const totalIncome = financials.filter(f => f.type === "income").reduce((sum, curr) => sum + curr.amount, 0)
  const totalExpenses = financials.filter(f => f.type === "expense").reduce((sum, curr) => sum + curr.amount, 0)
  const savings = totalIncome - totalExpenses
  const savingsPercent = Math.round((savings / totalIncome) * 100) || 0

  const handleDeleteFinancial = (id: number) => {
    setFinancials(financials.filter(f => f.id !== id))
    toast({
      title: "Entry removed",
      description: "The financial entry has been removed successfully."
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white shadow-sm px-5 py-4 flex items-center">
        <button className="mr-3" onClick={handleBack}>
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold">My Financials</h1>
      </header>

      {/* Financials Content */}
      <div className="flex-1 px-5 py-6 overflow-y-auto">
        {/* Summary Card */}
        <div className="bg-blue-500 text-white rounded-xl shadow-md p-5 mb-6">
          <h2 className="text-lg font-bold mb-2">Monthly Summary</h2>
          <div className="flex justify-between mb-2">
            <span>Income:</span>
            <span className="font-medium">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Expenses:</span>
            <span className="font-medium">{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="h-px bg-blue-400 my-2"></div>
          <div className="flex justify-between mb-2">
            <span>Savings:</span>
            <span className="font-bold">{formatCurrency(savings)}</span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Savings Rate</span>
              <span>{savingsPercent}%</span>
            </div>
            <Progress value={savingsPercent} className="h-2 bg-blue-300" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-4">
          <button 
            className={`flex-1 py-2 text-center font-medium ${activeTab === "overview" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button 
            className={`flex-1 py-2 text-center font-medium ${activeTab === "income" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"}`}
            onClick={() => setActiveTab("income")}
          >
            Income
          </button>
          <button 
            className={`flex-1 py-2 text-center font-medium ${activeTab === "expenses" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"}`}
            onClick={() => setActiveTab("expenses")}
          >
            Expenses
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === "overview" && (
          <div>
            <h3 className="text-lg font-bold mb-3">Monthly Budget</h3>
            <div className="space-y-4">
              {financials.slice(0, 4).map((financial) => (
                <div key={financial.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${financial.type === "income" ? "bg-green-100 text-green-500" : "bg-red-100 text-red-500"}`}>
                        {financial.type === "income" ? "↑" : "↓"}
                      </div>
                      <div>
                        <h4 className="font-medium">{financial.category}</h4>
                        <p className={`text-sm ${financial.type === "income" ? "text-green-500" : "text-red-500"}`}>
                          {financial.type === "income" ? "+" : "-"}{formatCurrency(financial.amount)}
                        </p>
                      </div>
                    </div>
                    <button className="text-gray-400" onClick={() => handleDeleteFinancial(financial.id)}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "income" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold">Income Sources</h3>
              <Button 
                className="text-xs bg-green-500 hover:bg-green-600"
                onClick={() => {
                  toast({
                    title: "Coming soon",
                    description: "This feature will be available in the next update."
                  })
                }}
              >
                Add Income
              </Button>
            </div>
            <div className="space-y-4">
              {financials.filter(f => f.type === "income").map((income) => (
                <div key={income.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{income.category}</h4>
                      <p className="text-sm text-green-500">+{formatCurrency(income.amount)}</p>
                    </div>
                    <button className="text-gray-400" onClick={() => handleDeleteFinancial(income.id)}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "expenses" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold">Expenses</h3>
              <Button 
                className="text-xs bg-red-500 hover:bg-red-600"
                onClick={() => {
                  toast({
                    title: "Coming soon",
                    description: "This feature will be available in the next update."
                  })
                }}
              >
                Add Expense
              </Button>
            </div>
            <div className="space-y-4">
              {financials.filter(f => f.type === "expense").map((expense) => (
                <div key={expense.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{expense.category}</h4>
                      <p className="text-sm text-red-500">-{formatCurrency(expense.amount)}</p>
                    </div>
                    <button className="text-gray-400" onClick={() => handleDeleteFinancial(expense.id)}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

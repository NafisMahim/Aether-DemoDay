import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface PremiumScreenProps {
  handleBack: () => void
}

interface PlanFeature {
  name: string
  included: boolean
}

interface PlanOption {
  id: string
  name: string
  price: number
  period: string
  features: PlanFeature[]
  popular?: boolean
}

export default function PremiumScreen({ handleBack }: PremiumScreenProps) {
  const { toast } = useToast()
  const [selectedPlan, setSelectedPlan] = useState<string>("pro")
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")

  const planOptions: PlanOption[] = [
    {
      id: "basic",
      name: "Basic",
      price: billingPeriod === "monthly" ? 0 : 0,
      period: billingPeriod === "monthly" ? "month" : "year",
      features: [
        { name: "Limited quiz attempts", included: true },
        { name: "Basic personalization", included: true },
        { name: "Standard support", included: true },
        { name: "Ad-supported experience", included: true },
        { name: "Priority features", included: false },
        { name: "Premium insights", included: false },
        { name: "Unlimited quizzes", included: false },
      ]
    },
    {
      id: "pro",
      name: "Pro",
      price: billingPeriod === "monthly" ? 9.99 : 99.99,
      period: billingPeriod === "monthly" ? "month" : "year",
      features: [
        { name: "Unlimited quiz attempts", included: true },
        { name: "Advanced personalization", included: true },
        { name: "Priority support", included: true },
        { name: "Ad-free experience", included: true },
        { name: "Priority features", included: true },
        { name: "Premium insights", included: true },
        { name: "Custom themes", included: false },
      ],
      popular: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: billingPeriod === "monthly" ? 19.99 : 199.99,
      period: billingPeriod === "monthly" ? "month" : "year",
      features: [
        { name: "Unlimited quiz attempts", included: true },
        { name: "Advanced personalization", included: true },
        { name: "24/7 dedicated support", included: true },
        { name: "Ad-free experience", included: true },
        { name: "Priority features", included: true },
        { name: "Premium insights", included: true },
        { name: "Custom themes", included: true },
      ]
    }
  ]

  const handleUpgrade = () => {
    const selectedPlanDetails = planOptions.find(plan => plan.id === selectedPlan)
    
    toast({
      title: "Subscription initiated",
      description: `You've selected the ${selectedPlanDetails?.name} plan. This feature will be fully implemented in the next update.`
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price)
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
        <h1 className="text-xl font-bold">Aether Premium</h1>
      </header>

      {/* Premium Content */}
      <div className="flex-1 px-5 py-6 overflow-y-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Upgrade Your Experience</h2>
          <p className="text-gray-600">Get more out of Aether with our premium plans</p>
        </div>

        {/* Billing Toggle */}
        <div className="bg-white rounded-lg p-3 flex justify-center items-center space-x-4 mb-6">
          <span className={`text-sm font-medium ${billingPeriod === "monthly" ? "text-blue-600" : "text-gray-500"}`}>Monthly</span>
          <button 
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${billingPeriod === "yearly" ? "bg-blue-600" : "bg-gray-300"}`}
            onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
          >
            <span 
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billingPeriod === "yearly" ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
          <div className="flex flex-col items-start">
            <span className={`text-sm font-medium ${billingPeriod === "yearly" ? "text-blue-600" : "text-gray-500"}`}>Yearly</span>
            <span className="text-xs text-green-500 font-medium">Save 17%</span>
          </div>
        </div>

        {/* Plan Options */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {planOptions.map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white rounded-xl shadow-sm p-5 border-2 ${selectedPlan === plan.id ? "border-blue-500" : "border-transparent"} relative`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">Popular</span>
              )}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="flex items-baseline mt-1">
                    <span className="text-2xl font-bold">{formatPrice(plan.price)}</span>
                    <span className="text-gray-500 ml-1">/{plan.period}</span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.id ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                  {selectedPlan === plan.id && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <svg 
                      className={`w-5 h-5 mr-2 ${feature.included ? "text-green-500" : "text-gray-300"}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d={feature.included ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"}
                      ></path>
                    </svg>
                    <span className={`text-sm ${feature.included ? "text-gray-700" : "text-gray-400"}`}>{feature.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="bg-blue-50 rounded-xl p-5 mb-6">
          <h3 className="font-bold mb-3">Premium Benefits</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <div>
                <h4 className="font-medium">Enhanced Productivity</h4>
                <p className="text-sm text-gray-600">Unlock advanced tools to boost your productivity and efficiency.</p>
              </div>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              <div>
                <h4 className="font-medium">Advanced Security</h4>
                <p className="text-sm text-gray-600">Keep your data protected with our enhanced security features.</p>
              </div>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h4 className="font-medium">Priority Support</h4>
                <p className="text-sm text-gray-600">Get faster responses and dedicated support from our team.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-6">
          <h3 className="font-bold mb-3">Frequently Asked Questions</h3>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium">Can I cancel anytime?</h4>
              <p className="text-sm text-gray-600 mt-1">Yes, you can cancel your subscription at any time. Your premium features will remain active until the end of your billing cycle.</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium">How do I switch plans?</h4>
              <p className="text-sm text-gray-600 mt-1">You can switch between plans at any time. If you upgrade, you'll be charged the prorated difference. If you downgrade, you'll receive a credit towards your next billing cycle.</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium">Is there a free trial?</h4>
              <p className="text-sm text-gray-600 mt-1">Yes, all premium plans come with a 14-day free trial. You won't be charged until the trial period ends.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Subscribe Button */}
      <div className="px-5 py-4 border-t bg-white">
        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 font-medium py-3"
          onClick={handleUpgrade}
        >
          Upgrade to {planOptions.find(plan => plan.id === selectedPlan)?.name}
        </Button>
        <p className="text-xs text-center text-gray-500 mt-2">No credit card required for free trial</p>
      </div>
    </div>
  )
}

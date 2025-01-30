'use client'

import React, { useState, useEffect } from 'react'
import { HelpCircle, Download } from 'lucide-react'
import { Button } from "@/components/ui/button"
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import Image from 'next/image'

const POSITION_DEFAULTS = {
  'software-engineer': {
    title: 'Software Engineer',
    ranges: {
      junior: { phMin: 800, phMax: 1200, usSalary: 85000 },
      mid: { phMin: 1500, phMax: 2500, usSalary: 120000 },
      senior: { phMin: 2500, phMax: 4000, usSalary: 150000 }
    }
  },
  'web-developer': {
    title: 'Web Developer',
    ranges: {
      junior: { phMin: 700, phMax: 1000, usSalary: 75000 },
      mid: { phMin: 1200, phMax: 2000, usSalary: 100000 },
      senior: { phMin: 2000, phMax: 3500, usSalary: 130000 }
    }
  },
  'data-scientist': {
    title: 'Data Scientist',
    ranges: {
      junior: { phMin: 1000, phMax: 1500, usSalary: 90000 },
      mid: { phMin: 1800, phMax: 3000, usSalary: 130000 },
      senior: { phMin: 3000, phMax: 4500, usSalary: 160000 }
    }
  }
}

const RATES = {
  MANDATORY_BENEFITS: 0.0967,
  HMO_MONTHLY: 50,
  EOR_FEE: 0.15,
  OFFSHORE_FEE: 200
}

export default function CostCalculator() {
  const [inputs, setInputs] = useState({
    position: 'software-engineer',
    level: 'mid',
    numEmployees: 1,
    usSalary: 120000,
    usBenefits: 28,
    phSalary: 2000
  })

  const [costs, setCosts] = useState({
    us: { total: 0, baseSalary: 0, benefits: 0 },
    ph: {
      total: 0,
      baseSalary: 0,
      mandatoryBenefits: 0,
      hmo: 0,
      thirteenthMonth: 0,
      separationAccrual: 0,
      eorFee: 0,
      offshoreFee: 0
    },
    savings: { annual: 0, percentage: 0 }
  })

  useEffect(() => {
    calculateCosts()
  }, [inputs])

  const calculateCosts = () => {
    // US Costs
    const annualUsSalary = inputs.usSalary * inputs.numEmployees
    const usBenefits = annualUsSalary * (inputs.usBenefits / 100)
    const totalUsCost = annualUsSalary + usBenefits

    // PH Costs
    const monthlyPhSalary = inputs.phSalary
    const annualPhBaseSalary = monthlyPhSalary * 12 * inputs.numEmployees
    const thirteenthMonth = monthlyPhSalary * inputs.numEmployees
    const mandatoryBenefits = annualPhBaseSalary * RATES.MANDATORY_BENEFITS
    const annualHmo = RATES.HMO_MONTHLY * 12 * inputs.numEmployees
    const eorFee = annualPhBaseSalary * RATES.EOR_FEE
    const offshoreFee = RATES.OFFSHORE_FEE * 12 * inputs.numEmployees
    const separationAccrual = thirteenthMonth

    const totalPhCost = annualPhBaseSalary + thirteenthMonth + mandatoryBenefits + 
                       annualHmo + eorFee + offshoreFee + separationAccrual

    const annualSavings = totalUsCost - totalPhCost
    const savingsPercentage = (annualSavings / totalUsCost) * 100

    setCosts({
      us: {
        baseSalary: annualUsSalary,
        benefits: usBenefits,
        total: totalUsCost
      },
      ph: {
        baseSalary: annualPhBaseSalary,
        mandatoryBenefits,
        hmo: annualHmo,
        thirteenthMonth,
        separationAccrual,
        eorFee,
        offshoreFee,
        total: totalPhCost
      },
      savings: {
        annual: annualSavings,
        percentage: savingsPercentage
      }
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'position' || name === 'level') {
      const position = name === 'position' ? value : inputs.position
      const level = name === 'level' ? value : inputs.level
      const range = POSITION_DEFAULTS[position as keyof typeof POSITION_DEFAULTS].ranges[level as keyof typeof POSITION_DEFAULTS['software-engineer']['ranges']]
      
      setInputs(prev => ({
        ...prev,
        [name]: value,
        usSalary: range.usSalary,
        phSalary: (range.phMin + range.phMax) / 2
      }))
    } else {
      setInputs(prev => ({
        ...prev,
        [name]: Number(value)
      }))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleDownload = () => {
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(18)
    doc.text('Cost Savings Report', 105, 15, { align: 'center' })

    // Add content
    doc.setFontSize(12)
    doc.text(`Position: ${POSITION_DEFAULTS[inputs.position as keyof typeof POSITION_DEFAULTS].title}`, 20, 30)
    doc.text(`Level: ${inputs.level}`, 20, 40)
    doc.text(`Number of Employees: ${inputs.numEmployees}`, 20, 50)

    // US Costs table
    doc.autoTable({
      head: [['US Costs', 'Amount']],
      body: [
        ['Base Salary', formatCurrency(costs.us.baseSalary)],
        ['Benefits', formatCurrency(costs.us.benefits)],
        ['Total US Cost', formatCurrency(costs.us.total)],
      ],
      startY: 60,
    })

    // PH Costs table
    doc.autoTable({
      head: [['PH Costs', 'Amount']],
      body: [
        ['Base Salary', formatCurrency(costs.ph.baseSalary)],
        ['13th Month', formatCurrency(costs.ph.thirteenthMonth)],
        ['Mandatory Benefits', formatCurrency(costs.ph.mandatoryBenefits)],
        ['HMO', formatCurrency(costs.ph.hmo)],
        ['EOR Fee', formatCurrency(costs.ph.eorFee)],
        ['Offshore Fee', formatCurrency(costs.ph.offshoreFee)],
        ['Total PH Cost', formatCurrency(costs.ph.total)],
      ],
      startY: doc.lastAutoTable.finalY + 10,
    })

    // Savings Summary
    doc.autoTable({
      head: [['Savings Summary', 'Amount']],
      body: [
        ['Annual Savings', formatCurrency(costs.savings.annual)],
        ['Savings Percentage', `${costs.savings.percentage.toFixed(2)}%`],
      ],
      startY: doc.lastAutoTable.finalY + 10,
    })

    // Save the PDF
    doc.save('cost_savings_report.pdf')
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="text-center mb-8">
          <Image
            src="/Remotify Primary a.png"
            alt="Remotify Logo"
            width={200}
            height={60}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">The Remotify EOR Sample Cost Calculator</h1>
          <p className="text-gray-600">Calculate your hiring costs savings with us</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <div className="group relative">
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-sm rounded shadow-lg">
                    Select the role you're looking to fill. Each position has pre-configured salary ranges based on market data.
                  </div>
                </div>
              </div>
              <select
                name="position"
                value={inputs.position}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
              >
                {Object.entries(POSITION_DEFAULTS).map(([key, value]) => (
                  <option key={key} value={key}>{value.title}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700">Level</label>
                <div className="group relative">
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-sm rounded shadow-lg">
                    Experience level affects salary ranges and expected productivity. Junior (1-2 years), Mid-level (3-5 years), Senior (6+ years).
                  </div>
                </div>
              </div>
              <select
                name="level"
                value={inputs.level}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="junior">Junior (1-2 years)</option>
                <option value="mid">Mid-Level (3-5 years)</option>
                <option value="senior">Senior (6+ years)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700">Number of Employees</label>
                <div className="group relative">
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-sm rounded shadow-lg">
                    Number of positions you want to fill. All costs will be multiplied by this number to show total savings.
                  </div>
                </div>
              </div>
              <input
                type="number"
                name="numEmployees"
                value={inputs.numEmployees}
                onChange={handleInputChange}
                min="1"
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700">US Annual Salary (USD)</label>
                <div className="group relative">
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-sm rounded shadow-lg">
                    The annual salary you would pay for this position in the US. This is used as the baseline for cost comparison.
                  </div>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="usSalary"
                  value={inputs.usSalary}
                  onChange={handleInputChange}
                  className="w-full p-2 pl-6 border rounded-md"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700">US Benefits (%)</label>
                <div className="group relative">
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-sm rounded shadow-lg">
                    Percentage of US salary allocated for benefits including health insurance, 401k, and other perks. Typically ranges from 25-35%.
                  </div>
                </div>
              </div>
              <input
                type="number"
                name="usBenefits"
                value={inputs.usBenefits}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700">PH Monthly Salary (USD)</label>
                <div className="group relative">
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-sm rounded shadow-lg">
                    Monthly salary in USD for the Philippine-based employee. This includes the base salary but excludes mandatory benefits and other costs.
                  </div>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="phSalary"
                  value={inputs.phSalary}
                  onChange={handleInputChange}
                  className="w-full p-2 pl-6 border rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="font-semibold text-blue-800 mb-4">US Costs (Annual)</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Base Salary:</span>
                <span>{formatCurrency(costs.us.baseSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span>Benefits:</span>
                <span>{formatCurrency(costs.us.benefits)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-blue-200 pt-2">
                <span>Total:</span>
                <span>{formatCurrency(costs.us.total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="font-semibold text-green-800 mb-4">PH Costs (Annual)</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Base Salary:</span>
                <span>{formatCurrency(costs.ph.baseSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span>13th Month:</span>
                <span>{formatCurrency(costs.ph.thirteenthMonth)}</span>
              </div>
              <div className="flex justify-between">
                <span>Benefits:</span>
                <span>{formatCurrency(costs.ph.mandatoryBenefits)}</span>
              </div>
              <div className="flex justify-between">
                <span>HMO:</span>
                <span>{formatCurrency(costs.ph.hmo)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  EOR Payroll Processing Fee:
                  <div className="group relative ml-1">
                    <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                      15% of base salary
                    </div>
                  </div>
                </span>
                <span>{formatCurrency(costs.ph.eorFee)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  Fixed EOR Fee:
                  <div className="group relative ml-1">
                    <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                      $200 per month
                    </div>
                  </div>
                </span>
                <span>{formatCurrency(costs.ph.offshoreFee)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-green-200 pt-2">
                <span>Total:</span>
                <span>{formatCurrency(costs.ph.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg mb-6">
          <h2 className="font-semibold text-purple-800 mb-4">Savings Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-purple-600">Annual Savings</p>
              <p className="text-2xl font-bold text-purple-700">{formatCurrency(costs.savings.annual)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-purple-600">Savings Percentage</p>
              <p className="text-2xl font-bold text-purple-700">{Math.round(costs.savings.percentage)}%</p>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500 italic mb-6 text-center">
          This is just a sample calculator based on average salary. The results are subject to change in terms of experience, job position, skills and benefit status. This does not include cost of employee tools and training.
        </div>
        <Button onClick={handleDownload} className="w-full">
          <Download className="mr-2 h-4 w-4" /> Download PDF Report
        </Button>
      </div>
    </div>
  )
}


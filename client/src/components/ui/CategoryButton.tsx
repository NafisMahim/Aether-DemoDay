import React from "react"

interface CategoryButtonProps {
  icon: string
  label: string
  onClick: () => void
}

export default function CategoryButton({ icon, label, onClick }: CategoryButtonProps) {
  return (
    <div 
      className="bg-white rounded-xl p-4 shadow-md flex flex-col items-center justify-center cursor-pointer transform hover:scale-[1.03] transition-all duration-200"
      onClick={onClick}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

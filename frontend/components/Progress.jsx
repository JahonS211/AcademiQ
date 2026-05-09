import * as React from "react"
import { motion } from "framer-motion"

const Progress = React.forwardRef(({ value, max = 100, label, className = "", indicatorColor = "bg-indigo-600" }, ref) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={`w-full ${className}`} ref={ref}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
          <span className="text-xs font-bold text-slate-500">{value} / {max}</span>
        </div>
      )}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <motion.div
          className={`h-full w-full flex-1 transition-all ${indicatorColor}`}
          initial={{ x: "-100%" }}
          animate={{ x: `-${100 - percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress }

import * as React from "react"

import { cn } from "@/lib/utils"

export interface SelectProps extends React.ComponentProps<"select"> {
  /** 에러 상태 표시 */
  error?: boolean
}

/**
 * 공통 Select 컴포넌트
 * - 다크 테마 스타일
 * - 커스텀 화살표 아이콘 (오른쪽 안쪽 배치)
 * - 일관된 스타일 적용
 */
function Select({ className, error, children, ...props }: SelectProps) {
  return (
    <select
      data-slot="select"
      className={cn(
        // 기본 스타일
        "w-full px-4 py-2.5 pr-10 rounded-xl",
        "bg-slate-900/50 border border-white/10 text-white",
        "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
        "transition-colors duration-200",
        // 브라우저 기본 화살표 제거 및 커스텀 화살표
        "appearance-none",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')]",
        "bg-[length:1.25rem_1.25rem]",
        "bg-[right_0.75rem_center]",
        "bg-no-repeat",
        // option 및 optgroup 스타일 (드롭다운 내부)
        "[&_option]:bg-[#0f172a] [&_option]:text-white",
        "[&_optgroup]:bg-[#0f172a] [&_optgroup]:text-slate-400",
        // disabled 상태
        "disabled:opacity-50 disabled:cursor-not-allowed",
        // 에러 상태
        error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

Select.displayName = "Select"

export { Select }

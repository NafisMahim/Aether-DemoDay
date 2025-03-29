import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        if (variant === "destructive") {
          return (
            <Toast key={id} {...props} variant={variant} className="p-0 border-0 shadow-none">
              <div className="bg-red-500 w-full text-white rounded-xl overflow-hidden">
                <div className="p-4">
                  {title && <ToastTitle className="text-white font-bold">{title}</ToastTitle>}
                  {description && (
                    <ToastDescription className="text-white/90">{description}</ToastDescription>
                  )}
                </div>
                {action && <div className="px-4 pb-4">{action}</div>}
                <ToastClose className="text-white hover:text-white/80" />
              </div>
            </Toast>
          )
        }
        
        return (
          <Toast key={id} {...props} variant={variant}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

const PopoverOpenContext = React.createContext(false)

function Popover({
  onOpenChange,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  const [open, setOpen] = React.useState(false)

  return (
    <PopoverOpenContext.Provider value={open}>
      <PopoverPrimitive.Root
        data-slot="popover"
        modal={false}
        onOpenChange={(next) => {
          setOpen(next)
          onOpenChange?.(next)
        }}
        {...props}
      />
    </PopoverOpenContext.Provider>
  )
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const open = React.useContext(PopoverOpenContext)

  return (
    <PopoverPrimitive.Portal>
      <AnimatePresence>
        {open ? (
          <PopoverPrimitive.Content
            forceMount
            data-slot="popover-content"
            align={align}
            sideOffset={sideOffset}
            asChild
            {...props}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: -6, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.98, y: -4, filter: "blur(4px)" }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-xl border border-border/50 bg-popover/95 text-popover-foreground shadow-xl shadow-black/10 ring-1 ring-foreground/5 backdrop-blur-xl outline-none",
                className
              )}
            >
              {children}
            </motion.div>
          </PopoverPrimitive.Content>
        ) : null}
      </AnimatePresence>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent }

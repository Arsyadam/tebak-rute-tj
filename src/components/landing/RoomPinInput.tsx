import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'

export const ROOM_PIN_LENGTH = 5

type RoomPinInputProps = {
  value?: string
  disabled?: boolean
  error?: string | null
  onChange?: (code: string) => void
  onComplete: (code: string) => void
  onClearError?: () => void
}

export function RoomPinInput({
  value = '',
  disabled,
  error,
  onChange,
  onComplete,
  onClearError,
}: RoomPinInputProps) {
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: ROOM_PIN_LENGTH }, (_, i) => value[i] ?? ''),
  )
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const lastSubmitted = useRef('')

  useEffect(() => {
    const next = Array.from({ length: ROOM_PIN_LENGTH }, (_, i) => value[i] ?? '')
    setDigits(next)
    if (value.length < ROOM_PIN_LENGTH) lastSubmitted.current = ''
  }, [value])

  const emit = (next: string[]) => {
    const code = next.join('').toUpperCase()
    onChange?.(code)
    if (code.length === ROOM_PIN_LENGTH && code !== lastSubmitted.current) {
      lastSubmitted.current = code
      onComplete(code)
    }
  }

  const writeAt = (index: number, char: string) => {
    const cleaned = char.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!cleaned) return
    const next = [...digits]
    next[index] = cleaned[0]
    setDigits(next)
    onClearError?.()
    emit(next)
    if (index < ROOM_PIN_LENGTH - 1) refs.current[index + 1]?.focus()
  }

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...digits]
      if (next[index]) {
        next[index] = ''
        setDigits(next)
        onClearError?.()
        onChange?.(next.join(''))
        lastSubmitted.current = ''
      } else if (index > 0) {
        next[index - 1] = ''
        setDigits(next)
        onClearError?.()
        onChange?.(next.join(''))
        lastSubmitted.current = ''
        refs.current[index - 1]?.focus()
      }
      return
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus()
      return
    }
    if (e.key === 'ArrowRight' && index < ROOM_PIN_LENGTH - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData('text')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, ROOM_PIN_LENGTH)
    if (!pasted) return
    const next = Array.from({ length: ROOM_PIN_LENGTH }, (_, i) => pasted[i] ?? '')
    setDigits(next)
    onClearError?.()
    emit(next)
    const focusIdx = Math.min(pasted.length, ROOM_PIN_LENGTH - 1)
    refs.current[focusIdx]?.focus()
  }

  return (
    <div className="relative flex items-center gap-2">
      <span className="hidden text-[11px] font-bold uppercase tracking-wide text-[#108043] sm:inline">
        Code
      </span>
      <div className="flex items-center gap-1.5" role="group" aria-label="Kode room multiplayer">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            value={digit}
            disabled={disabled}
            inputMode="text"
            autoComplete="off"
            maxLength={1}
            aria-label={`Kode digit ${i + 1}`}
            className="h-8 w-8 rounded-md border border-[rgba(18,69,43,0.22)] bg-white text-center font-bold uppercase text-[#003324] shadow-sm outline-none transition focus:border-[#108043] focus:ring-2 focus:ring-[#108043]/25 disabled:opacity-50"
            onChange={(e) => writeAt(i, e.target.value.slice(-1))}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>
      {error ? (
        <div
          role="tooltip"
          className="absolute left-1/2 top-[calc(100%+8px)] z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#003324] px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
        >
          {error}
          <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-[#003324]" />
        </div>
      ) : null}
    </div>
  )
}

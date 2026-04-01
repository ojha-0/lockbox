import { useRef, useEffect } from 'react';

// 4-digit OTP input: 4 boxes, auto-advances, backspace goes back, paste supported.
export default function OtpBoxes({ value, onChange, length = 4, autoFocus = false, error = false }) {
  const refs = useRef([]);

  useEffect(() => {
    if (autoFocus && refs.current[0]) refs.current[0].focus();
  }, [autoFocus]);

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const setDigit = (i, d) => {
    const arr = digits.slice();
    arr[i] = d;
    onChange(arr.join(''));
  };

  const handleChange = (i, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) { setDigit(i, ''); return; }
    if (raw.length === 1) {
      setDigit(i, raw);
      if (i < length - 1) refs.current[i + 1]?.focus();
    } else {
      // pasted / typed multi-digit
      const chars = raw.slice(0, length - i).split('');
      const arr = digits.slice();
      chars.forEach((c, idx) => { arr[i + idx] = c; });
      onChange(arr.join(''));
      const next = Math.min(i + chars.length, length - 1);
      refs.current[next]?.focus();
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    e.preventDefault();
    onChange(text.padEnd(digits.join('').length, '').slice(0, length));
    const next = Math.min(text.length, length - 1);
    refs.current[next]?.focus();
  };

  return (
    <div className="flex gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`w-11 h-12 text-center text-lg font-semibold rounded-lg border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20 ${
            error ? 'border-red-400' : 'border-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

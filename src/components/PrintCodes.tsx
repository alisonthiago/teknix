'use client'

import QRCode from 'react-qr-code'
import Barcode from 'react-barcode'

export default function PrintCodes({ value }: { value: string }) {
  return (
    <div className="flex flex-col gap-2 items-center justify-center p-2 w-full max-w-full overflow-hidden">
      <div className="w-full flex justify-center overflow-hidden [&>svg]:max-w-full [&>svg]:h-auto">
        <Barcode value={value} width={0.7} height={35} fontSize={10} margin={0} displayValue={false} />
      </div>
      <div className="flex gap-4 items-center">
        <QRCode value={value} size={64} level="L" />
        <div className="text-[9px] font-mono select-all p-1 bg-[#f5f5f5] rounded border border-[#e6e6e6]">
          {value}
        </div>
      </div>
    </div>
  )
}

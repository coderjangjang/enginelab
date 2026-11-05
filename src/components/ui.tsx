import {ButtonHTMLAttributes,ReactNode} from 'react'
export function Btn({a,className='',...p}:{a?:boolean}&ButtonHTMLAttributes<HTMLButtonElement>){return <button {...p} className={`h-8 px-3 border border-black text-[11px] uppercase tracking-[.1em] transition-colors disabled:opacity-40 ${a?'bg-black text-white':'bg-white text-black hover:bg-mist'} ${className}`}/>}
export function Slider({label,value,min,max,step=1,unit='',onChange,disabled}:{label:string;value:number;min:number;max:number;step?:number;unit?:string;onChange:(v:number)=>void;disabled?:boolean}){
return <label className="block"><div className="flex justify-between text-[11px] uppercase tracking-[.1em] text-mid"><span>{label}</span><span className="font-mono text-black">{Number(value.toFixed(2))}{unit}</span></div>
<input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={e=>onChange(+e.target.value)}/></label>}
export const H=({children}:{children:ReactNode})=><h3 className="text-[11px] uppercase tracking-[.14em] text-mid mb-2">{children}</h3>
export const Row=({k,v}:{k:string;v:ReactNode})=><div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-mist text-xs"><span className="text-mid">{k}</span><span className="font-mono tabular-nums text-right">{v}</span></div>

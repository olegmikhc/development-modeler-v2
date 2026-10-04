import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Development Modeler 2.0 — Сценарии и экономика',description:'Time-driven development financial models, cash flow and scenario analysis.',icons:{icon:`${process.env.NEXT_PUBLIC_BASE_PATH||''}/favicon.svg`}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}

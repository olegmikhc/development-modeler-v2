import type {NextConfig} from 'next';
const config:NextConfig={...(process.env.NEXT_PUBLIC_STATIC_HOSTING==='true'?{output:'export',trailingSlash:true,basePath:process.env.NEXT_PUBLIC_BASE_PATH||''}:{}),turbopack:{root:process.cwd()},serverExternalPackages:['playwright'],async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'X-Frame-Options',value:'SAMEORIGIN'}]}]}};
export default config;

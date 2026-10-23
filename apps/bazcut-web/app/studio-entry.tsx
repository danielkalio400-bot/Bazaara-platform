'use client';
import dynamic from 'next/dynamic';
const Studio=dynamic(()=>import('../studio/Studio'),{ssr:false,loading:()=> <div style={{minHeight:'100vh',background:'#090c14',color:'#aac4ef',display:'grid',placeItems:'center'}}>Opening BazCut Studio…</div>});
export default Studio;

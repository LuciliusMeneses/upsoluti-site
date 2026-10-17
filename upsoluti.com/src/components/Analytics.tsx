"use client";
import { useEffect } from 'react';
import { track } from '@/lib/analytics';
export default function Analytics(){useEffect(()=>{function click(e:MouseEvent){const link=(e.target as HTMLElement).closest?.('a');if(link?.matches('[data-booking-link]'))track('booking_clicked',{source:window.location.pathname});if(link?.getAttribute('href')==='#proposta')track('proposal_clicked',{source:window.location.pathname});if(link?.getAttribute('href')?.startsWith('/contacto'))track('contact_clicked',{source:window.location.pathname});}document.addEventListener('click',click);return()=>document.removeEventListener('click',click);},[]);return null;}

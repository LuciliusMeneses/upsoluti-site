import {useEffect,useState} from 'react';
import type {Locale} from './domain';
export function useLocale(){const [locale,setLocale]=useState<Locale>(()=>{try{return localStorage.getItem('aura.locale')==='pt-PT'?'pt-PT':'pt-BR'}catch{return 'pt-BR'}});useEffect(()=>{document.documentElement.lang=locale;try{localStorage.setItem('aura.locale',locale)}catch{}},[locale]);return [locale,setLocale] as const}

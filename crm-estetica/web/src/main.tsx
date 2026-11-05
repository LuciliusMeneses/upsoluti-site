import React from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import Surfaces from './Surfaces';
import './styles.css';
import './commercial.css';
const client=new QueryClient({defaultOptions:{queries:{retry:1,refetchOnWindowFocus:true}}});
createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={client}><Surfaces/></QueryClientProvider></React.StrictMode>);

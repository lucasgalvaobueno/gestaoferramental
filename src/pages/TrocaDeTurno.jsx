import React from 'react';
import Navbar from '../components/Navbar';
import { ShiftHandoverFeed } from '../components/Feed/ShiftHandoverFeed';

export default function TrocaDeTurno() {
    return (
        <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Troca de Turno' }]} />
            
            <div className="container animate-fade-in" style={{ paddingTop: '2rem' }}>
                <ShiftHandoverFeed />
            </div>
        </div>
    );
}

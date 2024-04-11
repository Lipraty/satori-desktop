import React from 'react';
import { createRoot } from 'react-dom/client'
import { TitleBar } from './components/TitleBar'
import './App.scss'

const root = createRoot(document.body);
root.render(
  <>
    <TitleBar />
    <main>
      <h2>Hello from React!</h2>
    </main>
  </>
);

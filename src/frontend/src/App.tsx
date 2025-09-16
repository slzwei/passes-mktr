import React from 'react';
import { EditorProvider } from './hooks/useEditor';
import EditorLayout from './components/editor/EditorLayout';
import './App.css';

function App() {
  return (
    <EditorProvider>
      <div className="App">
        <EditorLayout />
      </div>
    </EditorProvider>
  );
}

export default App;

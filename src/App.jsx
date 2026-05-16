import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Game from '@/pages/Game';
import Stats from '@/pages/Stats';
import Review from '@/pages/Review';
import Tutorial from '@/pages/Tutorial';
import Framework from '@/pages/Framework';

function App() {
  React.useEffect(() => {
    document.title = 'GOATED Relational n-Back';
  }, []);

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route path="/" element={<Game />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/framework" element={<Framework />} />
          <Route path="/review/:sessionId" element={<Review />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App

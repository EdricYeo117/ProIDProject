import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HallOfFame from './components/hof/HallOfFame';
import NewPerson from './components/admin/NewPerson';
import NPTimeline from './components/timeline/NPTimeline';
import TopNav from './components/common/TopNav';
import CommunityCanvas from "./components/canvas/CommunityCanvas";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { err?: Error }> {
  constructor(props:any){ super(props); this.state = { err: undefined }; }
  static getDerivedStateFromError(err: Error){ return { err }; }
  componentDidCatch(err: Error, info:any){ console.error('App ErrorBoundary:', err, info); }
  render(){
    if (this.state.err){
      return (
        <div style={{ padding:16, color:'#b00020', background:'#fff1f2' }}>
          <h3>Something went wrong.</h3>
          <pre style={{ whiteSpace:'pre-wrap' }}>{String(this.state.err?.message || this.state.err)}</pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <TopNav />
      <Routes>
        <Route path="/" element={<HallOfFame />} />
        <Route path="/timeline" element={<NPTimeline />} />
        <Route path="/admin/new-person" element={<NewPerson />} />
        <Route path="/community-canvas" element={<CommunityCanvas />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;

// App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HallOfFame from "./components/hof/HallOfFame";
import NewPerson from "./components/admin/NewPerson";
import NPTimeline from "./components/timeline/NPTimeline";
import TopNav from "./components/common/TopNav";
import CommunityCanvas from "./components/canvas/CommunityCanvas";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { err?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { err: undefined };
  }
  static getDerivedStateFromError(err: Error) {
    return { err };
  }
  componentDidCatch(err: Error, info: any) {
    console.error("App ErrorBoundary:", err, info);
  }
  render() {
    if (this.state.err) {
      return (
        <div className="p-4 text-red-700 bg-red-50">
          <h3 className="font-semibold mb-1">Something went wrong.</h3>
          <pre className="whitespace-pre-wrap text-xs">
            {String(this.state.err?.message || this.state.err)}
          </pre>
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
      <div className="min-h-screen bg-slate-900">
        <Routes>
          <Route path="/" element={<HallOfFame />} />
          <Route path="/hall-of-fame" element={<HallOfFame />} />
          <Route path="/timeline" element={<NPTimeline />} />
          <Route path="/community-canvas" element={<CommunityCanvas />} />
          {/* Admin */}
          <Route path="/admin" element={<NewPerson />} />
          <Route path="/admin/new-person" element={<NewPerson />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
};

export default App;
